import inMemoryDominoes from "../../../infrastructure/repositories/inMemoryDominoes.js";
import { init } from "./init.js";
import type { GameDependencies } from "./game.js";
import { describe, expect, test } from "vitest";

describe("Game Init", () => {
  const dependencies: GameDependencies = {
    dominoesRepository: inMemoryDominoes(),
    uuidMethod: () => "uuid-test",
    randomMethod: (array) => array,
  };

  test("should init a game", async () => {
    // Arrange
    const useCase = init(dependencies);

    // Act
    const game = await useCase();

    // Assert
    expect(game.dominoes.length).toBe(48);
    expect(game.id).toBe("uuid-test");
  });
});
