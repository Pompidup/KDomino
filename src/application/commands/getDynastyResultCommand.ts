import type { GameWithResults } from "@core/domain/types/index.js";

export type GetDynastyResultCommand = {
  games: GameWithResults[];
};
