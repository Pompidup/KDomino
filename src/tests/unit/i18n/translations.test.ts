import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import {
  createTranslator,
  defaultTranslations,
  defaultTranslator,
  errorCodeToTranslationKey,
  TranslationKey,
  translateErrorCode,
} from "@core/i18n/translations.js";
import { describe, expect, test } from "vitest";

describe("translations", () => {
  describe("errorCodeToTranslationKey", () => {
    test("should map every ErrorCode to a TranslationKey", () => {
      for (const code of Object.values(ErrorCode)) {
        expect(errorCodeToTranslationKey[code]).toBeDefined();
      }
    });

    test("should map to valid translation keys with default translations", () => {
      for (const code of Object.values(ErrorCode)) {
        const translationKey = errorCodeToTranslationKey[code];
        expect(defaultTranslations[translationKey]).toBeDefined();
        expect(defaultTranslations[translationKey]).not.toBe("");
      }
    });

    test("should map specific codes correctly", () => {
      expect(errorCodeToTranslationKey[ErrorCode.LORD_NOT_FOUND]).toBe(
        TranslationKey.ERROR_LORD_NOT_FOUND,
      );
      expect(errorCodeToTranslationKey[ErrorCode.NOT_YOUR_TURN]).toBe(
        TranslationKey.ERROR_NOT_YOUR_TURN,
      );
      expect(errorCodeToTranslationKey[ErrorCode.PLACEMENT_NOT_EMPTY]).toBe(
        TranslationKey.ERROR_PLACEMENT_NOT_EMPTY,
      );
    });
  });

  describe("translateErrorCode", () => {
    test("should translate an error code to default English message", () => {
      const message = translateErrorCode(
        defaultTranslator,
        ErrorCode.LORD_NOT_FOUND,
      );
      expect(message).toBe("Lord not found");
    });

    test("should translate all error codes without throwing", () => {
      for (const code of Object.values(ErrorCode)) {
        const message = translateErrorCode(defaultTranslator, code);
        expect(message).toBeTypeOf("string");
        expect(message.length).toBeGreaterThan(0);
      }
    });
  });

  describe("createTranslator", () => {
    test("should use custom translations", () => {
      const translator = createTranslator({
        [TranslationKey.ERROR_LORD_NOT_FOUND]: "Seigneur introuvable",
      });

      expect(translator.t(TranslationKey.ERROR_LORD_NOT_FOUND)).toBe(
        "Seigneur introuvable",
      );
    });

    test("should fall back to default for missing keys", () => {
      const translator = createTranslator({
        [TranslationKey.ERROR_LORD_NOT_FOUND]: "Seigneur introuvable",
      });

      expect(translator.t(TranslationKey.ERROR_NOT_YOUR_TURN)).toBe(
        "It is not your turn",
      );
    });

    test("should interpolate parameters", () => {
      const translator = createTranslator({
        [TranslationKey.ERROR_LORD_NOT_FOUND]:
          "Lord {{lordId}} not found in game {{gameId}}",
      });

      const message = translator.t(TranslationKey.ERROR_LORD_NOT_FOUND, {
        lordId: "lord-42",
        gameId: "game-1",
      });

      expect(message).toBe("Lord lord-42 not found in game game-1");
    });

    test("should handle numeric parameters", () => {
      const translator = createTranslator({
        [TranslationKey.ERROR_INVALID_PLAYER_COUNT]:
          "Got {{count}} players, need 2-4",
      });

      const message = translator.t(TranslationKey.ERROR_INVALID_PLAYER_COUNT, {
        count: 5,
      });

      expect(message).toBe("Got 5 players, need 2-4");
    });
  });
});
