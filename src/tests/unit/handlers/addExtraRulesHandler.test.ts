import { addExtraRulesHandler } from "@application/handlers/addExtraRulesHandler.js";
import type { NextAction, NextStep } from "@core/domain/types/game.js";
import type { AddExtraRulesUseCase } from "@core/useCases/addExtraRules.js";
import { err, ok } from "@utils/result.js";
import { createGameBuilder } from "../../builder/game.js";
import type { AddExtraRulesCommand } from "@application/commands/addExtraRulesCommand.js";
import { describe, expect, test } from "vitest";
import { winstonLogger } from "@adapter/winstonLogger.js";

describe("AddExtraRulesHandler", () => {
  const logger = winstonLogger(false);

  test("should throw error if game is not with next step", () => {
    // Arrange
    const useCase: AddExtraRulesUseCase = () => {
      throw new Error("This should not be called");
    };

    const game = createGameBuilder<NextAction>().build();

    const command: AddExtraRulesCommand = {
      game,
      extraRules: ["rules1"],
    };

    // Act
    const act = () => addExtraRulesHandler(logger, useCase)(command);

    // Assert
    expect(act).toThrowError("Required game with nextAction type: 'step'");
  });

  test("should throw error if next action is not options", () => {
    // Arrange
    const useCase: AddExtraRulesUseCase = () => {
      throw new Error("This should not be called");
    };

    const game = createGameBuilder<NextStep>()
      .withNextAction({ type: "step", step: "addPlayers" })
      .build();

    const command: AddExtraRulesCommand = {
      game,
      extraRules: ["rules1"],
    };

    // Act
    const act = () => addExtraRulesHandler(logger, useCase)(command);

    // Assert
    expect(act).toThrowError("Required game with options step");
  });

  test("should return useCase error", () => {
    // Arrange
    const useCase: AddExtraRulesUseCase = () => err("useCase error");

    const game = createGameBuilder<NextStep>()
      .withNextAction({ type: "step", step: "options" })
      .build();

    const command: AddExtraRulesCommand = {
      game,
      extraRules: ["rules1"],
    };

    // Act
    const act = () => addExtraRulesHandler(logger, useCase)(command);

    // Assert
    expect(act).toThrowError("useCase error");
  });

  test("should return game with extra rules", () => {
    // Arrange
    const useCase: AddExtraRulesUseCase = (game, extraRules) => {
      return ok({
        ...game,
        rules: {
          ...game.rules,
          extra: extraRules.map((rule) => ({
            name: rule,
            description: "desc",
            mode: [],
          })),
        },
        nextAction: { type: "step", step: "addPlayers" },
      });
    };

    const game = createGameBuilder<NextStep>()
      .withNextAction({ type: "step", step: "options" })
      .build();

    const command: AddExtraRulesCommand = {
      game,
      extraRules: ["rules1"],
    };

    // Act
    const result = addExtraRulesHandler(logger, useCase)(command);

    // Assert
    expect(result).toEqual({
      ...game,
      rules: {
        ...game.rules,
        extra: [{ name: "rules1", description: "desc", mode: [] }],
      },
      nextAction: { type: "step", step: "addPlayers" },
    });
  });
});
