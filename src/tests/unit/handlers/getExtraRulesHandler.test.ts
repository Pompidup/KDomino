import { describe, expect, test } from "vitest";
import type { GetExtraRulesCommand } from "@application/commands/getExtraRulesCommand.js";
import { getExtraRulesHandler } from "@application/handlers/getExtraRulesHandler.js";
import type { ExtraRule } from "@core/domain/types/rule.js";
import type { GetExtraRulesUseCase } from "@core/useCases/getExtraRules.js";
import { err, ok } from "@utils/result.js";
import { winstonLogger } from "@adapter/winstonLogger.js";

describe("getExtraRulesHandler", () => {
  const logger = winstonLogger(false);

  test("should throw an error if result is an error", () => {
    // Arrange
    const command: GetExtraRulesCommand = { mode: "Classic", players: 4 };
    const mockUseCase: GetExtraRulesUseCase = () => err("Use case failed");
    const handler = getExtraRulesHandler(logger, mockUseCase);

    // Act
    const act = () => handler(command);

    // Assert
    expect(act).toThrowError("Use case failed");
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
    const handler = getExtraRulesHandler(logger, mockUseCase);

    // Act
    const result = handler(command);

    // Assert
    expect(result).toEqual(extraRules);
  });
});
