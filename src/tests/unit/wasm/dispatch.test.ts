import type { GameWithNextStep } from "@core/domain/types/game.js";
import type { GameEngine } from "@core/portUserside/engine.js";
import { describe, expect, it } from "vitest";
import { createGameEngine } from "../../../index.js";
import { dispatch } from "../../../wasm/dispatch.js";

describe("WASM dispatch", () => {
  const engine: GameEngine = createGameEngine({});

  it("should return modes for getModes", () => {
    const response = dispatch(engine, { method: "getModes", params: {} });

    expect("result" in response).toBe(true);
    if ("result" in response) {
      expect(Array.isArray(response.result)).toBe(true);
    }
  });

  it("should create a game with createGame", () => {
    const response = dispatch(engine, {
      method: "createGame",
      params: { mode: "Classic" },
    });

    expect("result" in response).toBe(true);
    if ("result" in response) {
      const game = response.result as GameWithNextStep;
      expect(game.id).toBeDefined();
      expect(game.dominoes).toHaveLength(48);
    }
  });

  it("should handle a multi-step flow: createGame -> addPlayers", () => {
    const createResponse = dispatch(engine, {
      method: "createGame",
      params: { mode: "Classic" },
    });
    expect("result" in createResponse).toBe(true);

    const game = (createResponse as { result: unknown }).result;
    const addPlayersResponse = dispatch(engine, {
      method: "addPlayers",
      params: { game, players: ["Alice", "Bobby"] },
    });

    expect("result" in addPlayersResponse).toBe(true);
    if ("result" in addPlayersResponse) {
      const updated = addPlayersResponse.result as GameWithNextStep;
      expect(updated.players).toHaveLength(2);
    }
  });

  it("should return error for unknown method", () => {
    const response = dispatch(engine, {
      method: "unknownMethod",
      params: {},
    });

    expect("error" in response).toBe(true);
    if ("error" in response) {
      expect(response.error.code).toBe("UNKNOWN_METHOD");
      expect(response.error.message).toContain("unknownMethod");
    }
  });

  it("should return domain error for invalid params", () => {
    const response = dispatch(engine, {
      method: "createGame",
      params: { mode: "NonExistentMode" },
    });

    expect("error" in response).toBe(true);
    if ("error" in response) {
      expect(response.error.code).toBeDefined();
      expect(response.error.message).toBeDefined();
    }
  });
});
