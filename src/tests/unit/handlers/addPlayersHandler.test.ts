import { addPlayersHandler } from "./../../../application/handlers/addPlayersHandler.js";
import { AddPlayersCommand } from "./../../../application/commands/addPlayersCommand.js";
import { NextStep } from "../../../core/domain/types/game.js";
import { createGameBuilder } from "../../builder/game.js";
import { AddPlayersUseCase } from "./../../../core/useCases/addPlayers.js";
import { describe, expect, test } from "vitest";
import { err, ok } from "../../../utils/result.js";
import { Kingdom } from "../../../core/domain/types/kingdom.js";

describe("AddPlayersHandler", () => {
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
    const act = () => addPlayersHandler(useCase)(command);

    // Assert
    expect(act).toThrowError("Invalid next action");
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
    const act = () => addPlayersHandler(useCase)(command);

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
    const result = addPlayersHandler(useCase)(command);

    // Assert
    expect(result.players).toEqual([
      { id: "playerId", name: "player1", kingdom: [] },
      { id: "playerId", name: "player2", kingdom: [] },
    ]);
    expect(result.nextAction).toEqual({ type: "step", step: "options" });
  });
});
