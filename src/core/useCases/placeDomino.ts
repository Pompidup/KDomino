import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import { err, isErr, isOk, ok } from "@utils/result.js";
import {
  gameSteps,
  type GameState,
  type GameStateResult,
  type GameWithNextAction,
  type NextAction,
  type NextStep,
} from "@core/domain/types/game.js";
import {
  allLordsHavePlayed,
  canPlaceAndDominoPickedIsDefined,
  nextLordWithAction,
} from "@core/domain/entities/lord.js";
import {
  calculateDominoPosition,
  placeDomino,
} from "@core/domain/entities/kingdom.js";
import { playerActions } from "@core/domain/types/player.js";
import type { Position, Rotation } from "@core/domain/types/kingdom.js";
import {
  isOriginsMode,
  isResourceMode,
} from "@core/domain/entities/originsHelpers.js";
import { createResourceForTile } from "@core/domain/entities/resource.js";
import { takeFireToken } from "@core/domain/entities/fireToken.js";
import type { PendingFireToken, Resource } from "@core/domain/types/origins.js";

export type PlaceDominoUseCase = (
  game: GameWithNextAction,
  lordId: string,
  position: Position,
  rotation: Rotation,
) => GameStateResult;

/**
 * Finds the volcano tile position(s) in a just-placed domino.
 * Returns the first volcano tile with craters, or undefined.
 */
const findVolcanoInDomino = (
  game: GameWithNextAction,
  position: Position,
  rotation: Rotation,
): { craters: number; volcanoPosition: Position } | undefined => {
  const lord = game.lords.find((l) => l.id === game.nextAction.nextLord);
  if (!lord?.dominoPicked) return undefined;

  const [first, second] = calculateDominoPosition(
    position,
    rotation,
    lord.dominoPicked,
  );

  for (const placed of [first, second]) {
    if (
      placed.tile.type === "volcano" &&
      placed.tile.volcanoCraters &&
      placed.tile.volcanoCraters > 0
    ) {
      return {
        craters: placed.tile.volcanoCraters,
        volcanoPosition: placed.position,
      };
    }
  }
  return undefined;
};

export const placeDominoUseCase: PlaceDominoUseCase = (
  game,
  lordId,
  position,
  rotation,
) => {
  const nextAction = game.nextAction;

  const currentLord = game.lords.find(
    (lord) => lord.id === nextAction.nextLord,
  );

  if (!currentLord) {
    return err(ErrorCode.LORD_NOT_FOUND);
  }

  if (currentLord.id !== lordId) {
    return err(ErrorCode.NOT_YOUR_TURN);
  }

  if (!canPlaceAndDominoPickedIsDefined(currentLord)) {
    return err(ErrorCode.CANNOT_PLACE);
  }

  const domino = currentLord.dominoPicked;

  const currentPlayer = game.players.find(
    (player) => player.id === currentLord.playerId,
  );

  if (!currentPlayer) {
    return err(ErrorCode.PLAYER_NOT_FOUND);
  }

  const updatedKingdom = placeDomino(
    currentPlayer.kingdom,
    position,
    rotation,
    domino,
    game.rules.basic.maxKingdomSize,
  );

  if (isErr(updatedKingdom)) {
    return updatedKingdom;
  }

  // Collect resources from placed tiles (Totem/Tribe modes)
  let newResources: Resource[] = [];
  if (isResourceMode(game.mode.name)) {
    const [first, second] = calculateDominoPosition(position, rotation, domino);
    for (const placed of [first, second]) {
      const resource = createResourceForTile(placed.tile, placed.position);
      if (resource) {
        newResources.push(resource);
      }
    }
  }

  const updatedPlayers = game.players.map((player) => {
    if (player.id === currentPlayer.id) {
      const updated = { ...player, kingdom: updatedKingdom.value };
      if (newResources.length > 0 && updated.resources) {
        updated.resources = [...updated.resources, ...newResources];
      }
      return updated;
    }
    return player;
  });

  const maxTurns = game.rules.basic.maxTurns;
  const currentTurn = game.turn;
  const isLastTurn = currentTurn === maxTurns;

  const updatedLords = game.lords.map((lord) => {
    if (lord.id === currentLord.id) {
      if (isLastTurn) {
        return {
          ...lord,
          turnEnded: true,
          hasPlace: true,
        };
      }
      return {
        ...lord,
        hasPlace: true,
      };
    }
    return lord;
  });

  let updatedGame: GameState;

  const resultStep: NextStep = {
    type: "step",
    step: gameSteps.result,
  };

  const isQueenDomino = game.mode.name === "QueenDomino";
  const isOrigins = isOriginsMode(game.mode.name);

  if (isLastTurn && allLordsHavePlayed(updatedLords) && !isQueenDomino && !isOrigins) {
    updatedGame = {
      ...game,
      lords: updatedLords,
      nextAction: resultStep,
      players: updatedPlayers,
    };
  } else if (isQueenDomino && !isLastTurn) {
    // In QueenDomino, after placing a domino, the same lord gets optional actions
    updatedGame = {
      ...game,
      lords: updatedLords,
      nextAction: {
        type: "action",
        nextLord: currentLord.id,
        nextAction: playerActions.placeKnight,
      },
      players: updatedPlayers,
    };
  } else if (isQueenDomino && isLastTurn) {
    // Last turn in QueenDomino: optional actions before checking if all lords done
    const queenDominoAction: NextAction = {
      type: "action",
      nextLord: currentLord.id,
      nextAction: playerActions.placeKnight,
    };
    updatedGame = {
      ...game,
      lords: updatedLords,
      nextAction: queenDominoAction,
      players: updatedPlayers,
    };
  } else if (isOrigins) {
    // Origins: check for volcano to grant fire token
    const volcano = findVolcanoInDomino(game, position, rotation);
    let updatedOrigins = game.origins;

    if (volcano && updatedOrigins) {
      const tokenResult = takeFireToken(
        updatedOrigins.fireTokenPool,
        volcano.craters,
      );
      if (isOk(tokenResult)) {
        // Grant fire token and set pending for placement
        const pendingFireToken: PendingFireToken = {
          fires: tokenResult.value.fires,
          volcanoPosition: volcano.volcanoPosition,
        };
        updatedOrigins = {
          ...updatedOrigins,
          fireTokenPool: tokenResult.value.updatedPool,
          pendingFireToken,
        };

        // Route to placeFireToken action
        updatedGame = {
          ...game,
          lords: updatedLords,
          players: updatedPlayers,
          origins: updatedOrigins,
          nextAction: {
            type: "action",
            nextLord: currentLord.id,
            nextAction: playerActions.placeFireToken,
          },
        };
      } else {
        // Pool empty for this crater type - skip fire token, go to pickDomino
        if (isLastTurn && allLordsHavePlayed(updatedLords)) {
          updatedGame = {
            ...game,
            lords: updatedLords,
            nextAction: resultStep,
            players: updatedPlayers,
            origins: updatedOrigins,
          };
        } else if (isLastTurn) {
          updatedGame = {
            ...game,
            lords: updatedLords,
            nextAction: resultStep,
            players: updatedPlayers,
            origins: updatedOrigins,
          };
        } else {
          updatedGame = {
            ...game,
            lords: updatedLords,
            nextAction: nextLordWithAction(updatedLords) as NextAction,
            players: updatedPlayers,
            origins: updatedOrigins,
          };
        }
      }
    } else {
      // No volcano placed - skip straight to next action
      if (isLastTurn && allLordsHavePlayed(updatedLords)) {
        updatedGame = {
          ...game,
          lords: updatedLords,
          nextAction: resultStep,
          players: updatedPlayers,
        };
      } else if (isLastTurn) {
        updatedGame = {
          ...game,
          lords: updatedLords,
          nextAction: resultStep,
          players: updatedPlayers,
        };
      } else {
        updatedGame = {
          ...game,
          lords: updatedLords,
          nextAction: nextLordWithAction(updatedLords) as NextAction,
          players: updatedPlayers,
        };
      }
    }
  } else {
    updatedGame = {
      ...game,
      lords: updatedLords,
      nextAction: nextLordWithAction(updatedLords) as NextAction,
      players: updatedPlayers,
    };
  }

  return ok(updatedGame);
};
