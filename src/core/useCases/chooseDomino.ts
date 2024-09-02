import {
  nextLordWithAction,
  resetLordsActions,
} from "./../domain/entities/lord.js";
import { type GameWithNextAction } from "../domain/types/game.js";
import { err, ok, type Result } from "../../utils/result.js";
import {
  allLordsHavePlayed,
  canPick,
  updateLordOrder,
} from "../domain/entities/lord.js";

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
    return err("Lord not found");
  }

  if (currentLord.id !== lordId) {
    return err("Not your turn");
  }

  if (!canPick(currentLord)) {
    return err("Lord can't pick");
  }

  // Check if dominoPick is valid choice
  const selectedDomino = game.currentDominoes.find(
    (domino) => domino.domino.number === dominoPick
  );

  if (!selectedDomino) {
    return err("Domino not found");
  }

  if (selectedDomino.picked) {
    return err("Domino already picked");
  }

  // update currentDominoes
  const updatedCurrentDominoes = game.currentDominoes.map((domino) => {
    if (domino.domino.number === dominoPick) {
      domino.picked = true;
      domino.lordId = currentLord.id;
    }
    return domino;
  });

  // update lords
  const updatedLords = game.lords.map((lord) => {
    if (lord.id === currentLord.id) {
      lord.hasPick = true;
      lord.turnEnded = true;
      lord.dominoPicked = selectedDomino.domino;
    }
    return lord;
  });

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
