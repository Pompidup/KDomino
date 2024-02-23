import type { Game } from "domain/entities/game";
import type { GamesRepository } from "domain/port/gamesRepository";

interface InMemoryGamesRepository extends GamesRepository {
  setup: (game: Game) => Promise<void>;
  reset: () => Promise<void>;
}

const inMemoryGamesRepository = (): InMemoryGamesRepository => {
  const games: Game[] = [];

  return {
    reset: async () => {
      games.length = 0;
    },

    setup: async (game: Game) => {
      games.push(game);
    },

    create: async (game: Game) => {
      games.push(game);
    },

    update: async (game: Partial<Game>) => {
      const index = games.findIndex((g) => g.id === game.id);
      if (index === -1) {
        throw new Error("Game not found");
      }

      const currentGame = games[index];

      const updatedGame = { ...currentGame!, ...game };

      games[index] = updatedGame;
    },

    get: async (id: string) => {
      const game = games.find((g) => g.id === id);
      if (!game) {
        return null;
      }

      return game;
    },
  };
};

export default inMemoryGamesRepository;
