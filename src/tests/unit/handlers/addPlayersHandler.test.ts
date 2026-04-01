import { winstonLogger } from "@adapter/winstonLogger.js";
import type { AddPlayersCommand } from "@application/commands/addPlayersCommand.js";
import { addPlayersHandler } from "@application/handlers/addPlayersHandler.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type { NextAction, NextStep } from "@core/domain/types/game.js";
import type { Kingdom } from "@core/domain/types/kingdom.js";
import { defaultTranslator } from "@core/i18n/translations.js";
import type { AddPlayersUseCase } from "@core/useCases/addPlayers.js";
import { err, ok } from "@utils/result.js";
import { describe, expect, test } from "vitest";
import { createGameBuilder } from "../../builder/game.js";

describe("AddPlayersHandler", () => {
  const logger = winstonLogger(false);

  test("should throw error if game is not with next step", () => {
    // Arrange
    const useCase: AddPlayersUseCase = () => {
      throw new Error("This should not be called");
    };

    const game = createGameBuilder<NextAction>().build();

    const command: AddPlayersCommand = {
      game,
      players: ["player1"],
    };

    // Act
    const act = () =>
      addPlayersHandler(logger, defaultTranslator, useCase)(command);

    // Assert
    expect(act).toThrowError("Invalid game step");
  });

  test("should throw error if next action is not addPlayers", () => {
    // Arrange
    const useCase: AddPlayersUseCase = () => {
      throw new Error("This should not be called");
    };

    const game = createGameBuilder<NextStep>()
      .withNextAction({ type: "step", step: "options" })
      .build();

    const command: AddPlayersCommand = {
      game,
      players: ["player1"],
    };

    // Act
    const act = () =>
      addPlayersHandler(logger, defaultTranslator, useCase)(command);

    // Assert
    expect(act).toThrowError("Invalid game step");
  });

  test("should return useCase error", () => {
    // Arrange
    const useCase: AddPlayersUseCase = () =>
      err(ErrorCode.INVALID_PLAYER_COUNT);

    const game = createGameBuilder<NextStep>()
      .withNextAction({ type: "step", step: "addPlayers" })
      .build();

    const command: AddPlayersCommand = {
      game,
      players: ["player1"],
    };

    // Act
    const act = () =>
      addPlayersHandler(logger, defaultTranslator, useCase)(command);

    // Assert
    expect(act).toThrowError("Invalid number of players (2-4 required)");
  });

  test("should return game with players", () => {
    // Arrange
    const useCase: AddPlayersUseCase = (game, players) => {
      return ok({
        ...game,
        players: [
          ...players.map((name) => ({
            id: "playerId",
            name,
            kingdom: [] as Kingdom,
          })),
        ],
        nextAction: { type: "step", step: "options" },
      });
    };

    const game = createGameBuilder<NextStep>()
      .withNextAction({ type: "step", step: "addPlayers" })
      .build();

    const command: AddPlayersCommand = {
      game,
      players: ["player1", "player2"],
    };

    // Act
    const result = addPlayersHandler(
      logger,
      defaultTranslator,
      useCase,
    )(command);

    // Assert
    expect(result.players).toEqual([
      { id: "playerId", name: "player1", kingdom: [] },
      { id: "playerId", name: "player2", kingdom: [] },
    ]);
    expect(result.nextAction).toEqual({ type: "step", step: "options" });
  });
});
