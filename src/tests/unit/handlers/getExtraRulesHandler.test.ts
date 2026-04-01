import { winstonLogger } from "@adapter/winstonLogger.js";
import type { GetExtraRulesCommand } from "@application/commands/getExtraRulesCommand.js";
import { getExtraRulesHandler } from "@application/handlers/getExtraRulesHandler.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type { ExtraRule } from "@core/domain/types/rule.js";
import { defaultTranslator } from "@core/i18n/translations.js";
import type { GetExtraRulesUseCase } from "@core/useCases/getExtraRules.js";
import { err, ok } from "@utils/result.js";
import { describe, expect, test } from "vitest";

describe("getExtraRulesHandler", () => {
  const logger = winstonLogger(false);

  test("should throw an error if result is an error", () => {
    // Arrange
    const command: GetExtraRulesCommand = { mode: "Classic", players: 4 };
    const mockUseCase: GetExtraRulesUseCase = () =>
      err(ErrorCode.MODE_NOT_FOUND);
    const handler = getExtraRulesHandler(
      logger,
      defaultTranslator,
      mockUseCase,
    );

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Game mode not found");
  });

  test("should return extra rules if result is not an error", () => {
    // Arrange
    const command: GetExtraRulesCommand = { mode: "Classic", players: 4 };
    const extraRules: ExtraRule[] = [
      {
        name: "rule1",
        description: "desc1",
        mode: [{ name: "Classic", description: "Classic mode" }],
      },
    ];
    const mockUseCase: GetExtraRulesUseCase = () => ok(extraRules);
    const handler = getExtraRulesHandler(
      logger,
      defaultTranslator,
      mockUseCase,
    );

    // Act
    const result = handler(command);

    // Assert
    expect(result).toEqual(extraRules);
  });
});
