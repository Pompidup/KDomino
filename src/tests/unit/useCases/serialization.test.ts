import { describe, test, expect } from "vitest";
import {
  serializeGame,
  deserializeGame,
  createSavePoint,
  restoreFromSavePoint,
} from "@core/useCases/serialization.js";
import { createGameBuilder } from "../../builder/game.js";
import { isOk, isErr, unwrap } from "@utils/result.js";
import type { NextStep, NextAction } from "@core/domain/types/game.js";

const stepStart: NextStep = { type: "step", step: "start" };
const actionPick: NextAction = {
  type: "action",
  nextLord: "lord1-id",
  nextAction: "pickDomino",
};

const buildGameWithStep = () =>
  createGameBuilder().withAllDefaults().withNextAction(stepStart).build();

const buildGameWithAction = () =>
  createGameBuilder().withAllDefaults().withNextAction(actionPick).build();

describe("Serialization", () => {
  describe("serializeGame", () => {
    test("should serialize a game state to a JSON string", () => {
      const game = buildGameWithStep();
      const json = serializeGame(game);
      const parsed = JSON.parse(json);

      expect(parsed.version).toBe(1);
      expect(parsed.data).toBeDefined();
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.data.id).toBe(game.id);
    });

    test("should serialize a game with next action", () => {
      const game = buildGameWithAction();
      const json = serializeGame(game);
      const parsed = JSON.parse(json);

      expect(parsed.data.nextAction.type).toBe("action");
    });
  });

  describe("deserializeGame", () => {
    test("should deserialize a valid JSON string back to game state", () => {
      const game = buildGameWithStep();
      const json = serializeGame(game);
      const result = deserializeGame(json);

      expect(isOk(result)).toBe(true);
      const restored = unwrap(result);
      expect(restored.id).toBe(game.id);
      expect(restored.players).toEqual(game.players);
      expect(restored.lords).toEqual(game.lords);
    });

    test("should return error for invalid JSON", () => {
      const result = deserializeGame("not valid json");

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toContain("Failed to parse game JSON");
      }
    });

    test("should return error for missing version", () => {
      const result = deserializeGame(JSON.stringify({ data: { id: "test" } }));

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe("Invalid serialized game format");
      }
    });

    test("should return error for missing data", () => {
      const result = deserializeGame(JSON.stringify({ version: 1 }));

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe("Invalid serialized game format");
      }
    });

    test("should return error for unsupported version", () => {
      const result = deserializeGame(
        JSON.stringify({ version: 999, data: {} })
      );

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toContain("Unsupported serialization version");
      }
    });

    test("should return error for invalid game state structure", () => {
      const result = deserializeGame(
        JSON.stringify({ version: 1, data: { id: "test" }, timestamp: "now" })
      );

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe("Invalid game state structure");
      }
    });

    test("should preserve seed through serialization round-trip", () => {
      const game = createGameBuilder()
        .withAllDefaults()
        .withNextAction(stepStart)
        .withSeed("my-replay-seed")
        .build();
      const json = serializeGame(game);
      const result = deserializeGame(json);

      expect(isOk(result)).toBe(true);
      const restored = unwrap(result);
      expect(restored.seed).toBe("my-replay-seed");
    });
  });

  describe("createSavePoint", () => {
    test("should create a save point with metadata", () => {
      const game = buildGameWithStep();
      const savePoint = createSavePoint(game);

      expect(savePoint.gameId).toBe(game.id);
      expect(savePoint.turn).toBe(game.turn);
      expect(savePoint.createdAt).toBeDefined();
      expect(savePoint.serialized).toBeDefined();
    });
  });

  describe("restoreFromSavePoint", () => {
    test("should restore game state from a save point", () => {
      const game = buildGameWithStep();
      const savePoint = createSavePoint(game);
      const result = restoreFromSavePoint(savePoint);

      expect(isOk(result)).toBe(true);
      const restored = unwrap(result);
      expect(restored.id).toBe(game.id);
      expect(restored.turn).toBe(game.turn);
    });

    test("should return error for corrupted save point", () => {
      const savePoint = {
        serialized: "corrupted data",
        createdAt: new Date().toISOString(),
        gameId: "test",
        turn: 1,
      };
      const result = restoreFromSavePoint(savePoint);

      expect(isErr(result)).toBe(true);
    });
  });
});
