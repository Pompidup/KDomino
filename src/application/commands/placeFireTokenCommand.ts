import type { GameWithNextAction } from "@core/domain/types/game.js";
import type { Position } from "@core/domain/types/kingdom.js";

export type PlaceFireTokenCommand = {
  game: GameWithNextAction;
  lordId: string;
  position: Position;
};
