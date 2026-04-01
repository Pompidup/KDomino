import type { GameWithNextAction } from "@core/domain/types/game.js";
import type { Position } from "@core/domain/types/kingdom.js";

export type ConstructBuildingCommand = {
  game: GameWithNextAction;
  lordId: string;
  buildingId: number;
  position: Position;
};
