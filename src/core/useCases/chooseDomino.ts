import {
  allLordsHavePlayed,
  canPick,
  nextLordWithAction,
  resetLordsActions,
  updateLordOrder,
} from "@core/domain/entities/lord.js";
import { isTribeMode } from "@core/domain/entities/originsHelpers.js";
import type { GameWithNextAction } from "@core/domain/types/game.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import { playerActions } from "@core/domain/types/player.js";
import { err, ok, type Result } from "@utils/result.js";

export type ChooseDominoUseCase = (
  game: GameWithNextAction,
  lordId: string,
  dominoPick: number,
) => Result<GameWithNextAction>;

export const chooseDominoUseCase: ChooseDominoUseCase = (
  game,
  lordId,
  dominoPick,
) => {
  const currentLord = game.lords.find(
    (lord) => lord.id === game.nextAction.nextLord,
  );

  if (!currentLord) {
    return err(ErrorCode.LORD_NOT_FOUND);
  }

  if (currentLord.id !== lordId) {
    return err(ErrorCode.NOT_YOUR_TURN);
  }

  if (!canPick(currentLord)) {
    return err(ErrorCode.CANNOT_PICK);
  }

  // Check if dominoPick is valid choice
  const selectedDomino = game.currentDominoes.find(
    (domino) => domino.domino.number === dominoPick,
  );

  if (!selectedDomino) {
    return err(ErrorCode.DOMINO_NOT_FOUND);
  }

  if (selectedDomino.picked) {
    return err(ErrorCode.DOMINO_ALREADY_PICKED);
  }

  // update currentDominoes
  const updatedCurrentDominoes = game.currentDominoes.map((domino) =>
    domino.domino.number === dominoPick
      ? { ...domino, picked: true, lordId: currentLord.id }
      : domino,
  );

  const isTribe = isTribeMode(game.mode.name);

  // update lords - always mark turn ended
  const updatedLords = game.lords.map((lord) =>
    lord.id === currentLord.id
      ? {
          ...lord,
          hasPick: true,
          turnEnded: true,
          dominoPicked: selectedDomino.domino,
        }
      : lord,
  );

  const turnEnded = allLordsHavePlayed(updatedLords);

  if (turnEnded) {
    // All lords have picked - perform turn transition
    const lords = resetLordsActions(updateLordOrder(updatedLords));
    const updatedTurn = game.turn + 1;
    const dominoesCopy = [...game.dominoes];
    const dominoesDrawn = dominoesCopy.splice(
      0,
      game.rules.basic.dominoesPerTurn,
    );
    dominoesDrawn.sort((a, b) => a.number - b.number);

    // Age of Giants: discard some dominos from the sorted line before selection
    const discardCount = game.rules.basic.dominoesDiscardedPerTurn ?? 0;
    if (discardCount > 0) {
      dominoesDrawn.splice(0, discardCount);
    }

    const newCurrentDominoes = dominoesDrawn.map((domino, index) => ({
      domino,
      picked: false,
      lordId: null,
      position: index + 1,
    }));

    if (isTribe) {
      // In Tribe mode, route to recruitCaveman before advancing to new turn
      return ok({
        ...game,
        currentDominoes: newCurrentDominoes,
        dominoes: dominoesCopy,
        lords,
        turn: updatedTurn,
        nextAction: {
          type: "action",
          nextLord: currentLord.id,
          nextAction: playerActions.recruitCaveman,
        },
      });
    }

    const next = nextLordWithAction(lords);
    return ok({
      ...game,
      currentDominoes: newCurrentDominoes,
      dominoes: dominoesCopy,
      lords,
      turn: updatedTurn,
      nextAction: next,
    });
  }

  if (isTribe) {
    // In Tribe mode, route to recruitCaveman before next lord picks
    return ok({
      ...game,
      currentDominoes: updatedCurrentDominoes,
      lords: updatedLords,
      nextAction: {
        type: "action",
        nextLord: currentLord.id,
        nextAction: playerActions.recruitCaveman,
      },
    });
  }

  const next = nextLordWithAction(updatedLords);

  return ok({
    ...game,
    currentDominoes: updatedCurrentDominoes,
    lords: updatedLords,
    nextAction: next,
  });
};
