import { describe, expect, test } from "vitest";
import type { GetModesCommand } from "@application/commands/getModesCommand.js";
import { getModesHandler } from "@application/handlers/getModesHandler.js";
import type { GameMode } from "@core/domain/types/mode.js";
import type { GetModesUseCase } from "@core/useCases/getModes.js";
import { err, ok } from "@utils/result.js";
import { winstonLogger } from "@adapter/winstonLogger.js";

describe("getModesHandler", () => {
  const logger = winstonLogger(false);
  test("should return game modes when use case succeeds", () => {
    // Arrange
    const mockGameModes: GameMode[] = [
      { name: "Mode1", description: "Mode1" },
      { name: "Mode2", description: "Mode2" },
    ];

    const mockGetModesUseCase: GetModesUseCase = () => ok(mockGameModes);

    const command: GetModesCommand = {};
    const handler = getModesHandler(logger, mockGetModesUseCase);

    // Act
    const result = handler(command);

    // Assert
    expect(result).toEqual(mockGameModes);
  });

  test("should throw an error when use case fails", () => {
    // Arrange
    const mockGetModesUseCase: GetModesUseCase = () => err("Use case failed");

    const command: GetModesCommand = {};
    const handler = getModesHandler(logger, mockGetModesUseCase);

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Use case failed");
  });
});
