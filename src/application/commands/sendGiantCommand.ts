import type { GameWithNextAction } from "@core/domain/types/game.js";
import type { Position } from "@core/domain/types/kingdom.js";

export type SendGiantCommand = {
  game: GameWithNextAction;
  lordId: string;
  /** Index of the giant to send from the current player's giants array */
  giantIndex: number;
  /** ID of the opponent player to receive the giant */
  targetPlayerId: string;
  /**
   * Crown of the opponent's kingdom the giant will cover. Per the official
   * rules the targeted opponent chooses it: omit it and the engine places the
   * giant automatically when the opponent has a single free crown, or asks
   * the opponent with a `placeGiant` action otherwise. When provided, it must
   * be the crown chosen by the opponent.
   */
  targetCrownPosition?: Position;
};
