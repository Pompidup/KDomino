import type { GetValidActionTargetsCommand } from "./getValidActionTargetsCommand.js";

/**
 * Command for `getValidDominoPicks` (`chooseDomino`): any game state and an
 * optional lord (default: the lord that must play).
 */
export type GetValidDominoPicksCommand = GetValidActionTargetsCommand;
