import { describe, test, expect } from "vitest";
import { getModesUseCase } from "@core/useCases/getModes.js";
import type { GameMode } from "@core/domain/types/mode.js";
import { unwrap } from "@utils/result.js";

describe("Get available mode", () => {
  test("should retrieve one mode", () => {
    // Arrange
    const jsonModes: GameMode = {
      name: "Classic",
      description: "Classic mode",
    };

    const dependencies = {
      modeRepository: {
        getAvailables: () => [jsonModes],
      },
    };

    // Act
    const modes = getModesUseCase(dependencies)();

    // Assert
    const unwrapped = unwrap(modes);
    expect(unwrapped.length).toBe(1);
    expect(unwrapped[0]?.name).toBe("Classic");
    expect(unwrapped[0]?.description).toBe("Classic mode");
  });

  test("should retrieve all mode", () => {
    // Arrange
    const jsonModes: GameMode[] = [
      {
        name: "Classic",
        description: "Classic mode",
      },
      {
        name: "QueenDomino",
        description: "Queen Domino mode",
      },
    ];

    const dependencies = {
      modeRepository: {
        getAvailables: () => jsonModes,
      },
    };

    // Act
    const modes = getModesUseCase(dependencies)();

    // Assert
    const unwrapped = unwrap(modes);
    expect(unwrapped.length).toBe(2);
    expect(unwrapped[0]?.name).toBe("Classic");
    expect(unwrapped[0]?.description).toBe("Classic mode");
    expect(unwrapped[1]?.name).toBe("QueenDomino");
    expect(unwrapped[1]?.description).toBe("Queen Domino mode");
  });
});
