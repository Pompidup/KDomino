import type { Game, NextStep } from "../../core/domain/types/game.js";

export type AddPlayersCommand = {
  game: Game & { nextAction: NextStep };
  players: string[];
};
