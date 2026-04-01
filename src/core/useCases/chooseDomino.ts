import {
  allLordsHavePlayed,
  canPick,
  nextLordWithAction,
  resetLordsActions,
  updateLordOrder,
} from "@core/domain/entities/lord.js";
import type { GameWithNextAction } from "@core/domain/types/game.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import { err, ok, type Result } from "@utils/result.js";

export type ChooseDominoUseCase = (
  game: GameWithNextAction,
  lordId: string,
  dominoPick: number
) => Result<GameWithNextAction>;

export const chooseDominoUseCase: ChooseDominoUseCase = (
  game,
  lordId,
  dominoPick
) => {
  const currentLord = game.lords.find(
    (lord) => lord.id === game.nextAction.nextLord
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
    (domino) => domino.domino.number === dominoPick
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
      : domino
  );

  // update lords
  const updatedLords = game.lords.map((lord) =>
    lord.id === currentLord.id
      ? { ...lord, hasPick: true, turnEnded: true, dominoPicked: selectedDomino.domino }
      : lord
  );

  const turnEnded = allLordsHavePlayed(updatedLords);

  if (turnEnded) {
    const lords = resetLordsActions(updateLordOrder(updatedLords));
    const updatedTurn = game.turn + 1;
    const next = nextLordWithAction(lords);
    const dominoesCopy = [...game.dominoes];
    const dominoesDrawn = dominoesCopy.splice(
      0,
      game.rules.basic.dominoesPerTurn
    );
    dominoesDrawn.sort((a, b) => a.number - b.number);
    const updatedCurrentDominoes = dominoesDrawn.map((domino, index) => {
      return {
        domino,
        picked: false,
        lordId: null,
        position: index + 1,
      };
    });

    return ok({
      ...game,
      currentDominoes: updatedCurrentDominoes,
      dominoes: dominoesCopy,
      lords,
      turn: updatedTurn,
      nextAction: next,
    });
  }

  const next = nextLordWithAction(updatedLords);

  // update state
  const updatedState = {
    ...game,
    currentDominoes: updatedCurrentDominoes,
    lords: updatedLords,
    nextAction: next,
  };

  return ok(updatedState);
};
