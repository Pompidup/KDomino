import { addPlayersHandler } from "@application/handlers/addPlayersHandler.js";
import type { AddPlayersCommand } from "@application/commands/addPlayersCommand.js";
import type { NextAction, NextStep } from "@core/domain/types/game.js";
import { createGameBuilder } from "../../builder/game.js";
import type { AddPlayersUseCase } from "@core/useCases/addPlayers.js";
import { describe, expect, test } from "vitest";
import { err, ok } from "@utils/result.js";
import type { Kingdom } from "@core/domain/types/kingdom.js";
import { winstonLogger } from "@adapter/winstonLogger.js";

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
    const act = () => addPlayersHandler(logger, useCase)(command);

    // Assert
    expect(act).toThrowError("Required game with nextAction type: 'step'");
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
    const act = () => addPlayersHandler(logger, useCase)(command);

    // Assert
    expect(act).toThrowError("Required game with addPlayers step");
  });

  test("should return useCase error", () => {
    // Arrange
    const useCase: AddPlayersUseCase = () => err("useCase error");

    const game = createGameBuilder<NextStep>()
      .withNextAction({ type: "step", step: "addPlayers" })
      .build();

    const command: AddPlayersCommand = {
      game,
      players: ["player1"],
    };

    // Act
    const act = () => addPlayersHandler(logger, useCase)(command);

    // Assert
    expect(act).toThrowError("useCase error");
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
    const result = addPlayersHandler(logger, useCase)(command);

    // Assert
    expect(result.players).toEqual([
      { id: "playerId", name: "player1", kingdom: [] },
      { id: "playerId", name: "player2", kingdom: [] },
    ]);
    expect(result.nextAction).toEqual({ type: "step", step: "options" });
  });
});
