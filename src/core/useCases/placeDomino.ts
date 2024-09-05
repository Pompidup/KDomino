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
import type {
  Orientation,
  Position,
  Rotation,
} from "@core/domain/types/kingdom.js";

export type PlaceDominoUseCase = (
  game: GameWithNextAction,
  lordId: string,
  position: Position,
  orientation: Orientation,
  rotation: Rotation
) => GameStateResult;

export const placeDominoUseCase: PlaceDominoUseCase = (
  game,
  lordId,
  position,
  orientation,
  rotation
) => {
  const nextAction = game.nextAction;

  const currentLord = game.lords.find(
    (lord) => lord.id === nextAction.nextLord
  );

  if (!currentLord) {
    return err("Lord not found");
  }

  if (currentLord.id !== lordId) {
    return err("Not your turn");
  }

  if (!canPlaceAndDominoPickedIsDefined(currentLord)) {
    return err("Lord can't place");
  }

  const domino = currentLord.dominoPicked;

  const currentPlayer = game.players.find(
    (player) => player.id === currentLord.playerId
  );

  if (!currentPlayer) {
    return err("Player not found");
  }

  const updatedKingdom = placeDomino(
    currentPlayer.kingdom,
    position,
    orientation,
    rotation,
    domino
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

  if (isLastTurn && allLordsHavePlayed(updatedLords)) {
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
      nextAction: <NextAction>nextLordWithAction(updatedLords),
      players: updatedPlayers,
    };
  }

  return ok(updatedGame);
};
