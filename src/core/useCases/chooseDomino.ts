import {
import {
  allLordsHavePlayed,
  canPick,
  nextLordWithAction,
  resetLordsActions,
  updateLordOrder,
} from "@core/domain/entities/lord.js";
import type { GameWithNextAction } from "@core/domain/types/game.js";
import { err, ok, type Result } from "@utils/result.js";
import { chooseDominoAI } from "../ai/decisions.js";

export type ChooseDominoUseCase = (
  game: GameWithNextAction,
  lordId: string,
  dominoPick?: number // Made optional as AI will provide it
) => Result<GameWithNextAction>;

export const chooseDominoUseCase: ChooseDominoUseCase = (
  game,
  lordId,
  dominoPick // Human player's pick
) => {
  const player = game.players.find((p) => p.id === game.nextAction.nextLord);

  if (!player) {
    return err("Player not found (current turn player)");
  }

  // The lordId parameter must match the player whose turn it is
  if (player.id !== lordId) {
    return err("Not your turn (lordId does not match current player)");
  }

  const currentLord = game.lords.find((lord) => lord.id === player.id);

  if (!currentLord) {
    // This should ideally not happen if player was found and IDs match
    return err("Lord properties not found for the current player");
  }

  if (!canPick(currentLord)) {
    return err("Lord can't pick");
  }

  let chosenDominoNumber: number | null | undefined = dominoPick;

  if (player.isAI) {
    chosenDominoNumber = chooseDominoAI(game, player.id);
    if (chosenDominoNumber === null) {
      return err("AI failed to choose a domino");
    }
  } else if (chosenDominoNumber === undefined) {
    // If not AI and dominoPick is not provided, it's an error.
    return err("Domino pick not provided for human player");
  }

  // Check if chosenDominoNumber is valid choice
  const selectedDomino = game.currentDominoes.find(
    (domino) => domino.domino.number === chosenDominoNumber
  );

  if (!selectedDomino) {
    return err(`Domino with number ${chosenDominoNumber} not found`);
  }

  if (selectedDomino.picked) {
    return err(`Domino ${chosenDominoNumber} already picked`);
  }

  // update currentDominoes
  const updatedCurrentDominoes = game.currentDominoes.map((domino) => {
    if (domino.domino.number === chosenDominoNumber) {
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
