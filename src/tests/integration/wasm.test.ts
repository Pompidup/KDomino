import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const WASM_PATH = resolve(__dirname, "../../../dist/kingdomino-engine.wasm");

const hasWasmtime = (() => {
  try {
    execSync("wasmtime --version", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
})();

const hasWasm = existsSync(WASM_PATH);

function callWasm(method: string, params: unknown): unknown {
  const input = JSON.stringify({ method, params });
  const stdout = execSync(`echo '${input}' | wasmtime ${WASM_PATH}`, {
    encoding: "utf-8",
    timeout: 10_000,
  });
  return JSON.parse(stdout);
}

describe.skipIf(!hasWasmtime || !hasWasm)("WASM integration", () => {
  it("should return modes via getModes", () => {
    const response = callWasm("getModes", {}) as { result: unknown[] };
    expect(response.result).toBeDefined();
    expect(Array.isArray(response.result)).toBe(true);
    expect(response.result.length).toBeGreaterThan(0);
  });

  it("should create a game via createGame", () => {
    const response = callWasm("createGame", { mode: "Classic" }) as {
      result: { id: string; dominoes: unknown[] };
    };
    expect(response.result.id).toBeDefined();
    expect(response.result.dominoes).toHaveLength(48);
  });

  it("should handle full flow: createGame -> addPlayers -> startGame", () => {
    const createRes = callWasm("createGame", { mode: "Classic" }) as {
      result: unknown;
    };
    const game = createRes.result;

    const addRes = callWasm("addPlayers", {
      game,
      players: ["Alice", "Bobby"],
    }) as { result: { players: unknown[] } };
    expect(addRes.result.players).toHaveLength(2);

    const startRes = callWasm("startGame", { game: addRes.result }) as {
      result: { nextAction: string };
    };
    expect(startRes.result.nextAction).toBeDefined();
  });

  it("should return error for unknown method", () => {
    const response = callWasm("noSuchMethod", {}) as {
      error: { code: string; message: string };
    };
    expect(response.error).toBeDefined();
    expect(response.error.code).toBe("UNKNOWN_METHOD");
  });

  it("should return domain error for invalid mode", () => {
    const response = callWasm("createGame", { mode: "FakeMode" }) as {
      error: { code: string; message: string };
    };
    expect(response.error).toBeDefined();
    expect(response.error.code).toBeDefined();
  });

  it("should calculate score for a known kingdom", () => {
    const emptyKingdom = Array.from({ length: 9 }, (_, row) =>
      Array.from({ length: 9 }, (_, col) =>
        row === 4 && col === 4
          ? { ground: "castle", crowns: 0 }
          : { ground: "", crowns: 0 },
      ),
    );

    const response = callWasm("calculateScore", {
      kingdom: emptyKingdom,
    }) as { result: { points: number } };
    expect(response.result).toBeDefined();
    expect(response.result.points).toBe(0);
  });
});
