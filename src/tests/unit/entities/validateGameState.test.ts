import { validateGameState } from "@core/domain/entities/validateGameState.js";
import type { Game } from "@core/domain/types/game.js";
import type { ValidationIssue } from "@core/domain/types/validation.js";
import { createGameBuilder } from "../../builder/game.js";
import { describe, expect, test } from "vitest";

/** Helper: build a valid game state */
const validGame = (): Game =>
  createGameBuilder()
    .withAllDefaults()
    .withNextAction({ type: "action", nextLord: "lord1-id", nextAction: "pickDomino" })
    .build();

/** Helper: find issues by code */
const findByCode = (issues: ValidationIssue[], code: string) =>
  issues.filter((i) => i.code === code);

// ─── Tâche 1: Skeleton ────────────────────────────────────────────

describe("validateGameState - skeleton", () => {
  test("returns empty array for a valid game state", () => {
    const issues = validateGameState(validGame());
    expect(issues).toEqual([]);
  });

  test("returns ValidationIssue objects with correct shape", () => {
    const game = { ...validGame(), id: "" };
    const issues = validateGameState(game);
    expect(issues.length).toBeGreaterThan(0);
    const first = issues[0]!;
    expect(first).toHaveProperty("path");
    expect(first).toHaveProperty("code");
    expect(first).toHaveProperty("message");
    expect(first).toHaveProperty("severity");
  });
});

// ─── Tâche 2: Game structure ──────────────────────────────────────

describe("validateGameState - game structure", () => {
  test("detects empty id", () => {
    const game = { ...validGame(), id: "" };
    const issues = validateGameState(game);
    expect(findByCode(issues, "INVALID_ID")).toHaveLength(1);
  });

  test("detects negative turn", () => {
    const game = { ...validGame(), turn: -1 };
    const issues = validateGameState(game);
    expect(findByCode(issues, "INVALID_TURN")).toHaveLength(1);
  });

  test("detects non-integer turn", () => {
    const game = { ...validGame(), turn: 1.5 };
    const issues = validateGameState(game);
    expect(findByCode(issues, "INVALID_TURN")).toHaveLength(1);
  });

  test("detects invalid nextAction type", () => {
    const game = { ...validGame(), nextAction: { type: "invalid" } } as unknown as Game;
    const issues = validateGameState(game);
    expect(findByCode(issues, "INVALID_NEXT_ACTION_TYPE")).toHaveLength(1);
  });

  test("detects missing rules.basic", () => {
    const game = { ...validGame(), rules: { extra: [] } } as unknown as Game;
    const issues = validateGameState(game);
    expect(findByCode(issues, "INVALID_BASIC_RULES")).toHaveLength(1);
  });

  test("detects missing rules.extra", () => {
    const game = {
      ...validGame(),
      rules: { basic: validGame().rules.basic },
    } as unknown as Game;
    const issues = validateGameState(game);
    expect(findByCode(issues, "INVALID_EXTRA_RULES")).toHaveLength(1);
  });

  test("detects invalid mode", () => {
    const game = { ...validGame(), mode: { name: "", description: "x" } } as unknown as Game;
    const issues = validateGameState(game);
    expect(findByCode(issues, "INVALID_MODE_NAME")).toHaveLength(1);
  });
});

// ─── Tâche 3: Players ────────────────────────────────────────────

describe("validateGameState - players", () => {
  test("detects duplicate player IDs", () => {
    const game = validGame();
    game.players[1]!.id = game.players[0]!.id;
    const issues = validateGameState(game);
    expect(findByCode(issues, "DUPLICATE_PLAYER_ID")).toHaveLength(1);
  });

  test("detects short player name", () => {
    const game = validGame();
    game.players[0]!.name = "ab";
    const issues = validateGameState(game);
    expect(findByCode(issues, "INVALID_PLAYER_NAME")).toHaveLength(1);
  });

  test("detects invalid kingdom grid size", () => {
    const game = validGame();
    game.players[0]!.kingdom = [[]]; // wrong size
    const issues = validateGameState(game);
    expect(findByCode(issues, "INVALID_KINGDOM_GRID")).toHaveLength(1);
  });

  test("detects missing castle", () => {
    const game = validGame();
    // Replace all castle tiles with empty
    for (const row of game.players[0]!.kingdom) {
      for (let x = 0; x < row.length; x++) {
        if (row[x]!.type === "castle") {
          row[x] = { type: "empty", crowns: 0 };
        }
      }
    }
    const issues = validateGameState(game);
    expect(findByCode(issues, "MISSING_CASTLE")).toHaveLength(1);
  });

  test("detects multiple castles", () => {
    const game = validGame();
    // Add extra castle
    game.players[0]!.kingdom[0]![0] = { type: "castle", crowns: 0 };
    game.players[0]!.kingdom[0]![1] = { type: "castle", crowns: 0 };
    const issues = validateGameState(game);
    expect(findByCode(issues, "MULTIPLE_CASTLES").length).toBeGreaterThanOrEqual(1);
  });

  test("detects invalid tile type in kingdom", () => {
    const game = validGame();
    game.players[0]!.kingdom[0]![0] = { type: "lava" as never, crowns: 0 };
    const issues = validateGameState(game);
    expect(findByCode(issues, "INVALID_TILE_TYPE")).toHaveLength(1);
  });
});

// ─── Tâche 4: Dominoes ───────────────────────────────────────────

describe("validateGameState - dominoes", () => {
  test("detects duplicate domino numbers across piles", () => {
    const game = validGame();
    if (game.dominoes.length >= 2) {
      game.dominoes[1]!.number = game.dominoes[0]!.number;
      const issues = validateGameState(game);
      expect(findByCode(issues, "DUPLICATE_DOMINO_NUMBER")).toHaveLength(1);
    }
  });

  test("detects invalid domino number (zero)", () => {
    const game = validGame();
    if (game.dominoes.length > 0) {
      game.dominoes[0]!.number = 0;
      const issues = validateGameState(game);
      expect(findByCode(issues, "INVALID_DOMINO_NUMBER")).toHaveLength(1);
    }
  });

  test("detects picked domino without lordId", () => {
    const game = validGame();
    game.currentDominoes = [
      { domino: { left: { type: "wheat", crowns: 0 }, right: { type: "wheat", crowns: 0 }, number: 99 }, picked: true, lordId: null, position: 0 },
    ];
    const issues = validateGameState(game);
    expect(findByCode(issues, "PICKED_WITHOUT_LORD")).toHaveLength(1);
  });

  test("detects unpicked domino with lordId", () => {
    const game = validGame();
    game.currentDominoes = [
      { domino: { left: { type: "wheat", crowns: 0 }, right: { type: "wheat", crowns: 0 }, number: 98 }, picked: false, lordId: "lord1-id", position: 0 },
    ];
    const issues = validateGameState(game);
    expect(findByCode(issues, "UNPICKED_WITH_LORD")).toHaveLength(1);
  });

  test("allows same domino number in currentDominoes and lord's dominoPicked (by design)", () => {
    const game = validGame();
    const domino = { left: { type: "wheat" as const, crowns: 0 }, right: { type: "wheat" as const, crowns: 0 }, number: 99 };
    game.currentDominoes = [{ domino, picked: true, lordId: "lord1-id", position: 0 }];
    game.lords[0]!.dominoPicked = { ...domino };
    const issues = validateGameState(game);
    expect(findByCode(issues, "DUPLICATE_DOMINO_NUMBER")).toHaveLength(0);
  });

  test("detects duplicate domino number among lords' picked dominos", () => {
    const game = validGame();
    const domino = { left: { type: "wheat" as const, crowns: 0 }, right: { type: "wheat" as const, crowns: 0 }, number: 99 };
    game.lords[0]!.dominoPicked = { ...domino };
    game.lords[1]!.dominoPicked = { ...domino };
    const issues = validateGameState(game);
    expect(findByCode(issues, "DUPLICATE_DOMINO_NUMBER")).toHaveLength(1);
  });
});

// ─── Tâche 5: Lords ──────────────────────────────────────────────

describe("validateGameState - lords", () => {
  test("detects duplicate lord IDs", () => {
    const game = validGame();
    game.lords[1]!.id = game.lords[0]!.id;
    const issues = validateGameState(game);
    expect(findByCode(issues, "DUPLICATE_LORD_ID")).toHaveLength(1);
  });

  test("detects lord referencing non-existent player", () => {
    const game = validGame();
    game.lords[0]!.playerId = "non-existent-player";
    const issues = validateGameState(game);
    expect(findByCode(issues, "LORD_PLAYER_NOT_FOUND")).toHaveLength(1);
  });

  test("warns when turnEnded=true but hasPick=false", () => {
    const game = validGame();
    game.lords[0]!.turnEnded = true;
    game.lords[0]!.hasPick = false;
    game.lords[0]!.hasPlace = true;
    const issues = validateGameState(game);
    const flagIssues = findByCode(issues, "INCONSISTENT_LORD_FLAGS");
    expect(flagIssues).toHaveLength(1);
    expect(flagIssues[0]!.severity).toBe("warning");
  });
});

// ─── Tâche 6: Game flow ──────────────────────────────────────────

describe("validateGameState - game flow", () => {
  test("detects nextLord referencing non-existent lord", () => {
    const game = validGame();
    (game.nextAction as { nextLord: string }).nextLord = "non-existent-lord";
    const issues = validateGameState(game);
    expect(findByCode(issues, "NEXT_LORD_NOT_FOUND")).toHaveLength(1);
  });

  test("detects invalid player action in nextAction", () => {
    const game = validGame();
    (game.nextAction as { nextAction: string }).nextAction = "fly";
    const issues = validateGameState(game);
    expect(findByCode(issues, "INVALID_PLAYER_ACTION")).toHaveLength(1);
  });

  test("detects invalid game step", () => {
    const game = createGameBuilder()
      .withAllDefaults()
      .withNextAction({ type: "step", step: "invalid" as never })
      .build();
    const issues = validateGameState(game);
    expect(findByCode(issues, "INVALID_GAME_STEP")).toHaveLength(1);
  });

  test("accepts valid step", () => {
    const game = createGameBuilder()
      .withAllDefaults()
      .withNextAction({ type: "step", step: "addPlayers" })
      .build();
    const issues = validateGameState(game);
    expect(findByCode(issues, "INVALID_GAME_STEP")).toHaveLength(0);
  });
});

// ─── Tâche 7: Rules ──────────────────────────────────────────────

describe("validateGameState - rules", () => {
  test("detects zero lords in basic rules", () => {
    const game = validGame();
    game.rules.basic.lords = 0;
    const issues = validateGameState(game);
    expect(findByCode(issues, "INVALID_BASIC_RULE_VALUE")).toHaveLength(1);
  });

  test("detects negative maxDominoes", () => {
    const game = validGame();
    game.rules.basic.maxDominoes = -1;
    const issues = validateGameState(game);
    expect(findByCode(issues, "INVALID_BASIC_RULE_VALUE")).toHaveLength(1);
  });

  test("detects all invalid basic rule fields", () => {
    const game = validGame();
    game.rules.basic = { lords: 0, maxDominoes: 0, dominoesPerTurn: 0, maxTurns: 0, maxKingdomSize: 0 };
    const issues = validateGameState(game);
    expect(findByCode(issues, "INVALID_BASIC_RULE_VALUE")).toHaveLength(5);
  });

  test("detects invalid extra rule name", () => {
    const game = validGame();
    game.rules.extra = [{ name: "", description: "test", mode: [] }];
    const issues = validateGameState(game);
    expect(findByCode(issues, "INVALID_EXTRA_RULE_NAME")).toHaveLength(1);
  });
});
