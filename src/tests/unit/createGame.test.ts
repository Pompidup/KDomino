import { describe, test, expect } from "vitest";
import jsonDominoes from "../../adapterServerside/jsonDominoes.js";
import jsonModes from "../../adapterServerside/jsonModes.js";
import { createGameUseCase } from "../../core/useCases/createGame.js";
import { GameMode } from "../../core/domain/types/mode.js";
import { unwrap } from "../../utils/testHelpers.js";
import { NextStep } from "../../core/domain/types/game.js";

describe("Create game", () => {
  test("should create a new game", () => {
    // Arrange
    const fakeUuid = () => "uuid-test";

    const deps = {
      modeRepository: jsonModes(),
      dominoesRepository: jsonDominoes(),
      uuidMethod: fakeUuid,
    };

    // Act
    const result = createGameUseCase(deps)("Classic");

    // Assert
    expect(unwrap(result).id).toEqual("uuid-test");
  });

  test("should return error when mode is invalid", () => {
    // Arrange
    const fakeUuid = () => "uuid-test";

    const deps = {
      modeRepository: jsonModes(),
      dominoesRepository: jsonDominoes(),
      uuidMethod: fakeUuid,
    };

    // Act
    const result = createGameUseCase(deps)("Invalid");

    // Assert
    expect(result).toEqual({
      tag: "Err",
      error: "Invalid mode: Invalid",
    });
  });

  test("should return error when no dominoes found for mode", () => {
    // Arrange
    const fakeUuid = () => "uuid-test";

    const deps = {
      modeRepository: jsonModes(),
      dominoesRepository: {
        getForMode: (mode: GameMode) => [],
      },
      uuidMethod: fakeUuid,
    };

    // Act
    const result = createGameUseCase(deps)("Classic");

    // Assert
    expect(result).toEqual({
      tag: "Err",
      error: "No dominoes found for mode Classic",
    });
  });

  test("should return next step add players", () => {
    // Arrange
    const fakeUuid = () => "uuid-test";

    const deps = {
      modeRepository: jsonModes(),
      dominoesRepository: jsonDominoes(),
      uuidMethod: fakeUuid,
    };

    // Act
    const result = createGameUseCase(deps)("Classic");

    // Assert
    const unwrappedResult = unwrap(result);
    expect(unwrappedResult.nextAction.type).toBe("step");
    expect((unwrappedResult.nextAction as NextStep).step).toBe("addPlayers");
  });
});
