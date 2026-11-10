import { discardFromAgeOfGiantsLine } from "@core/domain/entities/ageOfGiantsHelpers.js";
import { startNewQueenDominoRound } from "@core/domain/entities/building.js";
import {
  allLordsHavePlayed,
  canPick,
  nextLordWithAction,
  resetLordsActions,
  updateLordOrder,
} from "@core/domain/entities/lord.js";
import { reserveNeolithicPairs } from "@core/domain/entities/neolithic.js";
import { isTribeMode } from "@core/domain/entities/originsHelpers.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type { GameWithNextAction } from "@core/domain/types/game.js";
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

  // Neolithic (Origins, 2 players): a domino reserved for the other player
  if (
    selectedDomino.reservedFor !== undefined &&
    selectedDomino.reservedFor !== currentLord.playerId
  ) {
    return err(ErrorCode.DOMINO_RESERVED);
  }

  // update currentDominoes (Neolithic: the first pick of the line reserves
  // the pair 1 & 4 or 2 & 3 for the lord's player, the other pair for the
  // opponent)
  const updatedCurrentDominoes = reserveNeolithicPairs(
    game,
    game.currentDominoes,
    currentLord,
    dominoPick,
  ).map((domino) =>
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
    const sortedLine = dominoesCopy.splice(0, game.rules.basic.dominoesPerTurn);
    sortedLine.sort((a, b) => a.number - b.number);

    // Age of Giants: discard the dominos at the official positions of the
    // sorted line (middle one at 2/4 players, 2nd and 4th at 3 players)
    const dominoesDrawn = discardFromAgeOfGiantsLine(
      sortedLine,
      game.rules.basic.dominoesDiscardedPerTurn ?? 0,
    );

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

    // Queendomino (incl. AoG-QD): new round, refill the Builders Board and
    // send the Dragon back to its cave
    const queendomino =
      game.queendomino && startNewQueenDominoRound(game.queendomino);

    const next = nextLordWithAction(lords);
    return ok({
      ...game,
      currentDominoes: newCurrentDominoes,
      dominoes: dominoesCopy,
      lords,
      turn: updatedTurn,
      nextAction: next,
      ...(queendomino && { queendomino }),
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
