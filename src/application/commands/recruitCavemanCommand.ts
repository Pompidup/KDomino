import type { GameWithNextAction } from "@core/domain/types/game.js";
import type { Position } from "@core/domain/types/kingdom.js";

export type RecruitCavemanCommand = {
  game: GameWithNextAction;
  lordId: string;
  /** ID of the caveman tile to recruit */
  cavemanId: number;
  /** Position on the kingdom to place the caveman */
  position: Position;
  /** Positions of resources to spend as payment */
  resourcePositions: Position[];
};
