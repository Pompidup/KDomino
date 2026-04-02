import type { GameWithNextAction } from "@core/domain/types/game.js";
import type { Position } from "@core/domain/types/kingdom.js";

export type SendGiantCommand = {
  game: GameWithNextAction;
  lordId: string;
  /** Index of the giant to send from the current player's giants array */
  giantIndex: number;
  /** ID of the opponent player to receive the giant */
  targetPlayerId: string;
  /** Position on the opponent's kingdom where the giant will cover a crown */
  targetCrownPosition: Position;
};
