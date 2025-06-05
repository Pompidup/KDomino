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
  Position,
  Position,
  Rotation,
} from "@core/domain/types/kingdom.js";
import { placeDominoAI } from "../ai/decisions.js";
import type { Placement } from "@core/domain/types/placement.js";

export type PlaceDominoUseCase = (
  game: GameWithNextAction,
  lordId: string,
  position?: Position, // Optional for AI
  rotation?: Rotation // Optional for AI
) => GameStateResult;

export const placeDominoUseCase: PlaceDominoUseCase = (
  game,
  lordId,
  position, // Human player's position
  rotation // Human player's rotation
) => {
  const nextAction = game.nextAction;

  const currentTurnPlayer = game.players.find(
    (p) => p.id === nextAction.nextLord
  );

  if (!currentTurnPlayer) {
    return err("Current turn player not found");
  }

  // lordId must match the current turn player
  if (currentTurnPlayer.id !== lordId) {
    return err("Not your turn (lordId does not match current player)");
  }

  const currentLord = game.lords.find((l) => l.id === currentTurnPlayer.id);

  if (!currentLord) {
    return err("Lord properties not found for the current player");
  }

  if (!canPlaceAndDominoPickedIsDefined(currentLord)) {
    return err("Lord can't place or no domino picked");
  }

  const domino = currentLord.dominoPicked;
  let chosenPlacement: Placement | null | undefined;

  if (currentTurnPlayer.isAI) {
    chosenPlacement = placeDominoAI(game, currentTurnPlayer.id);
    if (!chosenPlacement) {
      // This might indicate a pass is needed, or an error in AI logic if a placement was expected.
      // For now, consider it an error if AI fails to provide a placement.
      return err("AI failed to decide on a placement");
    }
  } else {
    if (!position || rotation === undefined) {
      return err("Position or rotation not provided for human player");
    }
    chosenPlacement = { position, rotation };
  }

  const updatedKingdom = placeDomino(
    currentTurnPlayer.kingdom,
    chosenPlacement.position,
    chosenPlacement.rotation,
    domino
  );

  if (isErr(updatedKingdom)) {
    return updatedKingdom;
  }

  const updatedPlayers = game.players.map((p) => {
    if (p.id === currentTurnPlayer.id) {
      return { ...p, kingdom: updatedKingdom.value };
    }
    return p;
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
