import { init } from "./init.js";
import type { GameDependencies } from "./game.js";
import { describe, expect, test } from "vitest";
import inMemoryDominoes from "../../../adapters/driven/inMemoryDominoes.js";

describe("Game Init", () => {
  const dependencies: GameDependencies = {
    dominoesRepository: inMemoryDominoes(),
    uuidMethod: () => "uuid-test",
    shuffleMethod: (array) => array,
  };

  test("should init a game", () => {
    // Arrange
    const useCase = init(dependencies);

    // Act
    const game = useCase();

    // Assert
    expect(game.dominoes.length).toBe(48);
    expect(game.id).toBe("uuid-test");
  });
});
