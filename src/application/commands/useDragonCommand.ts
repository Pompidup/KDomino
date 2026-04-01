import type { GameWithNextAction } from "@core/domain/types/game.js";

export type UseDragonCommand = {
  game: GameWithNextAction;
  lordId: string;
  buildingId: number;
};
