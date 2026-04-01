import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import { err, isErr, ok } from "@utils/result.js";
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
import { placeDomino } from "@core/domain/entities/kingdom.js";
import { playerActions } from "@core/domain/types/player.js";
import type {
  Position,
  Rotation,
} from "@core/domain/types/kingdom.js";

export type PlaceDominoUseCase = (
  game: GameWithNextAction,
  lordId: string,
  position: Position,
  rotation: Rotation
) => GameStateResult;

export const placeDominoUseCase: PlaceDominoUseCase = (
  game,
  lordId,
  position,
  rotation
) => {
  const nextAction = game.nextAction;

  const currentLord = game.lords.find(
    (lord) => lord.id === nextAction.nextLord
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
    (player) => player.id === currentLord.playerId
  );

  if (!currentPlayer) {
    return err(ErrorCode.PLAYER_NOT_FOUND);
  }

  const updatedKingdom = placeDomino(
    currentPlayer.kingdom,
    position,
    rotation,
    domino,
    game.rules.basic.maxKingdomSize
  );

  if (isErr(updatedKingdom)) {
    return updatedKingdom;
  }

  const updatedPlayers = game.players.map((player) => {
    if (player.id === currentPlayer.id) {
      player.kingdom = updatedKingdom.value;
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

  if (isLastTurn && allLordsHavePlayed(updatedLords)) {
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
  } else {
    updatedGame = {
      ...game,
      lords: updatedLords,
      nextAction: <NextAction>nextLordWithAction(updatedLords),
      players: updatedPlayers,
    };
  }

  return ok(updatedGame);
};
