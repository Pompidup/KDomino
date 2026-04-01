import { winstonLogger } from "@adapter/winstonLogger.js";
import type { AddExtraRulesCommand } from "@application/commands/addExtraRulesCommand.js";
import { addExtraRulesHandler } from "@application/handlers/addExtraRulesHandler.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type { NextAction, NextStep } from "@core/domain/types/game.js";
import { defaultTranslator } from "@core/i18n/translations.js";
import type { AddExtraRulesUseCase } from "@core/useCases/addExtraRules.js";
import { err, ok } from "@utils/result.js";
import { describe, expect, test } from "vitest";
import { createGameBuilder } from "../../builder/game.js";

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
    const act = () =>
      addExtraRulesHandler(logger, defaultTranslator, useCase)(command);

    // Assert
    expect(act).toThrowError("Invalid game step");
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
    const act = () =>
      addExtraRulesHandler(logger, defaultTranslator, useCase)(command);

    // Assert
    expect(act).toThrowError("Invalid game step");
  });

  test("should return useCase error", () => {
    // Arrange
    const useCase: AddExtraRulesUseCase = () =>
      err(ErrorCode.STEP_EXECUTION_FAILED);

    const game = createGameBuilder<NextStep>()
      .withNextAction({ type: "step", step: "options" })
      .build();

    const command: AddExtraRulesCommand = {
      game,
      extraRules: ["rules1"],
    };

    // Act
    const act = () =>
      addExtraRulesHandler(logger, defaultTranslator, useCase)(command);

    // Assert
    expect(act).toThrowError("Step execution failed");
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
    const result = addExtraRulesHandler(
      logger,
      defaultTranslator,
      useCase,
    )(command);

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
