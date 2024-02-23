import { test } from "@japa/runner";
import inMemoryDominoes from "../../../infrastructure/repositories/inMemoryDominoes.js";
import inMemoryGamesRepository from "../../../infrastructure/repositories/inMemoryGames.js";
import { init } from "./init.js";
import type { GameDependencies } from "./game.js";

test.group("Game Init", () => {
  const dependencies: GameDependencies = {
    dominoesRepository: inMemoryDominoes(),
    gamesRepository: inMemoryGamesRepository(),
    uuidMethod: () => "uuid-test",
    randomMethod: (array) => array,
  };

  test("should init a game", async ({ expect }) => {
    // Arrange
    const useCase = init(dependencies);

    // Act
    const game = await useCase();

    // Assert
    expect(game.dominoes.length).toBe(48);
    expect(game.id).toBe("uuid-test");
  });
});
