import type { Game } from "domain/entities/game";

export type GamesRepository = {
  create: (game: Game) => Promise<void>;
  update: (game: Partial<Game>) => Promise<void>;
  get: (id: string) => Promise<Game | null>;
};
