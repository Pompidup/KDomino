import { canPick } from "@core/domain/entities/lord.js";
import { pickableDominoNumbers } from "@core/domain/entities/neolithic.js";
import { isGameWithNextAction } from "@core/domain/types/game.js";
import { playerActions } from "@core/domain/types/player.js";
import type { ValidActionTargetsUseCase } from "./getValidActionTargets.js";

/**
 * Numbers of the revealed dominoes `chooseDomino` accepts for the lord
 * (default: the lord that must play): not picked yet and, with the Origins
 * "Neolithic" rule, not reserved for the other player. Empty when the game
 * does not wait for this lord to pick a domino.
 */
export const getValidDominoPicksUseCase: ValidActionTargetsUseCase<number[]> = (
  game,
  lordId,
) => {
  if (
    !isGameWithNextAction(game) ||
    game.nextAction.nextAction !== playerActions.pickDomino
  ) {
    return [];
  }
  const id = lordId ?? game.nextAction.nextLord;
  if (id !== game.nextAction.nextLord) return [];
  const lord = game.lords.find((l) => l.id === id);
  if (!lord || !canPick(lord)) return [];
  return pickableDominoNumbers(game.currentDominoes, lord);
};
