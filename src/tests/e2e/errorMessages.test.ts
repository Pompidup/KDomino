import {
  ActionExecutionError,
  DomainException,
  ErrorCode,
  InvalidStepError,
  StepExecutionError,
} from "@core/domain/errors/domainErrors.js";
import type { GameState } from "@core/domain/types/game.js";
import {
  createTranslator,
  errorCodeToTranslationKey,
  TranslationKey,
} from "@core/i18n/translations.js";
import { describe, expect, test } from "vitest";
import { createGameEngine } from "../../index.js";

describe("Error messages e2e", () => {
  test("errors should have code, message, and context", () => {
    const engine = createGameEngine({});

    let game: GameState = engine.createGame({ mode: "Classic" });
    game = engine.addPlayers({ game, players: ["Alice", "Bob"] });
    game = engine.startGame({ game });

    // Try to choose a domino with wrong lordId
    try {
      engine.chooseDomino({
        game,
        lordId: "wrong-lord-id",
        dominoPick: 1,
      });
      expect.unreachable("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ActionExecutionError);
      const domainError = error as ActionExecutionError;

      // Should have a proper error code
      expect(domainError.code).toBe(ErrorCode.NOT_YOUR_TURN);

      // Should have a translated message
      expect(domainError.message).toBe("It is not your turn");

      // Should have context
      expect(domainError.context).toBeDefined();
      expect(domainError.context?.gameId).toBe(game.id);
      expect(domainError.context?.lordId).toBe("wrong-lord-id");
    }
  });

  test("InvalidStepError should have code and context", () => {
    const engine = createGameEngine({});

    const game = engine.createGame({ mode: "Classic" });

    // Try to start game without adding players (wrong step)
    try {
      engine.startGame({ game });
      expect.unreachable("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidStepError);
      const domainError = error as InvalidStepError;

      expect(domainError.code).toBe(ErrorCode.INVALID_STEP);
      expect(domainError.message).toBe("Invalid game step");
      expect(domainError.context).toBeDefined();
    }
  });

  test("StepExecutionError should preserve original error code and context", () => {
    const engine = createGameEngine({});

    try {
      engine.createGame({ mode: "NonExistentMode" });
      expect.unreachable("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(StepExecutionError);
      const domainError = error as StepExecutionError;

      // Should preserve the original error code (MODE_NOT_FOUND), not generic STEP_EXECUTION_FAILED
      expect(domainError.code).toBe(ErrorCode.MODE_NOT_FOUND);
      expect(domainError.message).toBe("Game mode not found");
      expect(domainError.context).toBeDefined();
      expect(domainError.context?.mode).toBe("NonExistentMode");
    }
  });

  test("all errors should be instanceof DomainException", () => {
    const engine = createGameEngine({});

    try {
      engine.createGame({ mode: "InvalidMode" });
      expect.unreachable("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(DomainException);
    }
  });

  test("custom translator should produce localized error messages", () => {
    const frenchTranslator = createTranslator({
      [TranslationKey.ERROR_NOT_YOUR_TURN]: "Ce n'est pas votre tour",
      [TranslationKey.ERROR_INVALID_STEP]: "Étape de jeu invalide",
    });

    const engine = createGameEngine({
      translator: frenchTranslator,
    });

    let game: GameState = engine.createGame({ mode: "Classic" });
    game = engine.addPlayers({ game, players: ["Alice", "Bob"] });
    game = engine.startGame({ game });

    try {
      engine.chooseDomino({
        game,
        lordId: "wrong-lord-id",
        dominoPick: 1,
      });
      expect.unreachable("Should have thrown");
    } catch (error) {
      const domainError = error as ActionExecutionError;

      // Should use French translation
      expect(domainError.message).toBe("Ce n'est pas votre tour");

      // Code should still be the same constant
      expect(domainError.code).toBe(ErrorCode.NOT_YOUR_TURN);
    }
  });

  test("errorCodeToTranslationKey should cover all error codes", () => {
    for (const code of Object.values(ErrorCode)) {
      const key = errorCodeToTranslationKey[code];
      expect(key).toBeDefined();
    }
  });

  test("invalid player count should have proper error code and context", () => {
    const engine = createGameEngine({});

    const game = engine.createGame({ mode: "Classic" });

    try {
      engine.addPlayers({ game, players: [] });
      expect.unreachable("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(StepExecutionError);
      const domainError = error as StepExecutionError;

      // Should preserve the specific INVALID_PLAYER_COUNT code
      expect(domainError.code).toBe(ErrorCode.INVALID_PLAYER_COUNT);
      expect(domainError.message).toBe(
        "Invalid number of players (1-4 required)",
      );
      expect(domainError.context?.players).toEqual([]);
    }
  });
});
