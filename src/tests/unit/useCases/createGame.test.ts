import jsonDominoes from "@adapter/jsonDominoes.js";
import jsonModes from "@adapter/jsonModes.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type { NextStep } from "@core/domain/types/game.js";
import type { GameMode } from "@core/domain/types/mode.js";
import { createGameUseCase } from "@core/useCases/createGame.js";
import { unwrap } from "@utils/result.js";
import { describe, expect, test } from "vitest";

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
      error: ErrorCode.MODE_NOT_FOUND,
    });
  });

  test("should return error when no dominoes found for mode", () => {
    // Arrange
    const fakeUuid = () => "uuid-test";

    const deps = {
      modeRepository: jsonModes(),
      dominoesRepository: {
        getForMode: (_mode: GameMode) => [],
      },
      uuidMethod: fakeUuid,
    };

    // Act
    const result = createGameUseCase(deps)("Classic");

    // Assert
    expect(result).toEqual({
      tag: "Err",
      error: ErrorCode.DOMINO_NOT_FOUND,
    });
  });

  test("should store the provided seed", () => {
    // Arrange
    const fakeUuid = () => "uuid-test";

    const deps = {
      modeRepository: jsonModes(),
      dominoesRepository: jsonDominoes(),
      uuidMethod: fakeUuid,
    };

    // Act
    const result = createGameUseCase(deps)("Classic", "my-custom-seed");

    // Assert
    expect(unwrap(result).seed).toBe("my-custom-seed");
  });

  test("should auto-generate a seed when none is provided", () => {
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
    expect(unwrap(result).seed).toBeDefined();
    expect(unwrap(result).seed).toBe("uuid-test");
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
