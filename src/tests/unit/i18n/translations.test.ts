import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import { GROUND } from "@core/domain/types/domino.js";
import {
  hunterGathererKinds,
  resourceTypes,
  warriorTypes,
} from "@core/domain/types/origins.js";
import { playerActions } from "@core/domain/types/player.js";
import {
  cavemanKindToTranslationKey,
  createTranslator,
  defaultTranslations,
  defaultTranslator,
  englishTranslations,
  errorCodeToTranslationKey,
  extraRuleNameToTranslationKey,
  frenchTranslations,
  groundToTranslationKey,
  hunterGathererKindToTranslationKey,
  localeTranslations,
  modeNameToTranslationKey,
  playerActionToTranslationKey,
  resourceToTranslationKey,
  supportedLocales,
  TranslationKey,
  translateErrorCode,
  warriorTypeToTranslationKey,
} from "@core/i18n/translations.js";
import { describe, expect, test } from "vitest";
import cavemenJson from "../../../datasources/cavemen.json" with {
  type: "json",
};
import dominoesJson from "../../../datasources/dominoes.json" with {
  type: "json",
};
import modesJson from "../../../datasources/modes.json" with { type: "json" };
import rulesJson from "../../../datasources/rules.json" with { type: "json" };

const allKeys = Object.values(TranslationKey);

describe("translations", () => {
  describe("locales", () => {
    test("should ship English and French", () => {
      expect([...supportedLocales]).toEqual(["en", "fr"]);
      expect(localeTranslations.en).toBe(englishTranslations);
      expect(localeTranslations.en).toBe(defaultTranslations);
      expect(localeTranslations.fr).toBe(frenchTranslations);
    });

    test("translation keys should be unique", () => {
      expect(new Set(allKeys).size).toBe(allKeys.length);
    });

    test.each(
      supportedLocales,
    )("locale %s should define every key with a non-empty string", (locale) => {
      const dictionary = localeTranslations[locale];
      for (const key of allKeys) {
        expect(dictionary[key], `${locale}: ${key}`).toBeTypeOf("string");
        expect(dictionary[key]?.trim(), `${locale}: ${key}`).not.toBe("");
      }
    });

    test.each(
      supportedLocales,
    )("locale %s should not contain unknown keys", (locale) => {
      expect(Object.keys(localeTranslations[locale]).sort()).toEqual(
        [...allKeys].sort(),
      );
    });

    test("French translator should translate keys", () => {
      const translator = createTranslator(frenchTranslations);
      expect(translator.t(TranslationKey.ACTION_PLACE_KNIGHT)).toBe(
        "Placer un chevalier",
      );
      expect(translateErrorCode(translator, ErrorCode.NOT_YOUR_TURN)).toBe(
        "Ce n'est pas votre tour",
      );
    });
  });

  describe("domain mappings", () => {
    test("should map every terrain type, including Origins terrains", () => {
      for (const ground of GROUND) {
        const key = groundToTranslationKey[ground];
        expect(allKeys, ground).toContain(key);
      }
      expect(groundToTranslationKey.volcano).toBe(
        TranslationKey.GROUND_VOLCANO,
      );
    });

    test("should map every terrain used by the domino datasource", () => {
      for (const dominoes of Object.values(dominoesJson)) {
        for (const domino of dominoes as {
          left: { type: string };
          right: { type: string };
        }[]) {
          for (const type of [domino.left.type, domino.right.type]) {
            expect(
              groundToTranslationKey[
                type as keyof typeof groundToTranslationKey
              ],
              type,
            ).toBeDefined();
          }
        }
      }
    });

    test("should map every player action", () => {
      for (const action of Object.values(playerActions)) {
        expect(allKeys, action).toContain(playerActionToTranslationKey[action]);
      }
      expect(playerActionToTranslationKey.recruitCaveman).toBe(
        TranslationKey.ACTION_RECRUIT_CAVEMAN,
      );
    });

    test("should map every game mode of the datasource", () => {
      for (const mode of modesJson) {
        expect(allKeys, mode.name).toContain(
          modeNameToTranslationKey[mode.name],
        );
      }
    });

    test("should map every extra rule of the datasource", () => {
      for (const rule of rulesJson.extra) {
        expect(allKeys, rule.name).toContain(
          extraRuleNameToTranslationKey[rule.name],
        );
      }
    });

    test("should map every Origins resource and caveman type", () => {
      for (const resource of Object.values(resourceTypes)) {
        expect(allKeys).toContain(resourceToTranslationKey[resource]);
      }
      for (const kind of Object.values(hunterGathererKinds)) {
        expect(allKeys).toContain(hunterGathererKindToTranslationKey[kind]);
      }
      for (const type of Object.values(warriorTypes)) {
        expect(allKeys).toContain(warriorTypeToTranslationKey[type]);
      }
      for (const caveman of cavemenJson) {
        expect(allKeys).toContain(
          cavemanKindToTranslationKey[
            caveman.kind as keyof typeof cavemanKindToTranslationKey
          ],
        );
      }
    });
  });

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
