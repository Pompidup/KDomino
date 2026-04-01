import type { GameWithNextAction } from "@core/domain/types/game.js";

export type SkipOptionalActionCommand = {
  game: GameWithNextAction;
  lordId: string;
};
