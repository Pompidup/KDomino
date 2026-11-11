import { getWealthPoints } from "@core/domain/entities/economy.js";
import {
  calculateBuildingEndGameBonus,
  getQueenBonus,
} from "@core/domain/entities/queen.js";
import type { BuildingTile } from "@core/domain/types/building.js";
import type {
  GameState,
  GameWithNextAction,
  GameWithResults,
} from "@core/domain/types/game.js";
import { isGameWithNextAction } from "@core/domain/types/game.js";
import type { Position } from "@core/domain/types/kingdom.js";
import { type Player, playerActions } from "@core/domain/types/player.js";
import { describe, expect, test } from "vitest";
import { createGameEngine } from "../../index.js";

type Engine = ReturnType<typeof createGameEngine>;

type Policy = {
  knights: boolean;
  build: boolean;
  dragon: boolean;
};

type GameStats = {
  constructions: number;
  dragonRounds: number[];
  knightsPlaced: number;
  discards: number;
};

const currentPlayer = (game: GameWithNextAction): Player => {
  const lord = game.lords.find((l) => l.id === game.nextAction.nextLord)!;
  return game.players.find((p) => p.id === lord.playerId)!;
};

const openConstructionSquares = (player: Player): Position[] => {
  const occupied = new Set(
    (player.buildings ?? []).map((b) => `${b.position.x},${b.position.y}`),
  );
  const squares: Position[] = [];
  player.kingdom.forEach((row, y) => {
    row.forEach((tile, x) => {
      if (
        tile.type !== "empty" &&
        tile.type !== "castle" &&
        tile.hasConstructionSquare &&
        !occupied.has(`${x},${y}`)
      ) {
        squares.push({ x, y });
      }
    });
  });
  return squares;
};

/** Price paid by `player` for a building: the cost of its spot (Queen −1). */
const priceOf = (game: GameState, player: Player, building: BuildingTile) => {
  const board = game.queendomino!.buildersBoard;
  const slot = board.slots.findIndex((s) => s?.id === building.id);
  const discount = game.queendomino!.queenHolderId === player.id ? 1 : 0;
  return Math.max(0, board.slotCosts![slot]! - discount);
};

/** Buildings the player can pay for, cheapest first. */
const affordableBuildings = (game: GameState, player: Player) =>
  (game.queendomino?.buildersBoard.slots ?? [])
    .filter((s): s is BuildingTile => s !== null)
    .filter((b) => priceOf(game, player, b) <= (player.coins ?? 0))
    .sort(
      (a, b) =>
        priceOf(game, player, a) - priceOf(game, player, b) || a.id - b.id,
    );

const startQueenDomino = (engine: Engine, seed: string): GameState => {
  let game: GameState = engine.createGame({ mode: "QueenDomino", seed });
  game = engine.addPlayers({ game, players: ["Alice", "Bobby"] });
  return engine.startGame({ game });
};

/**
 * Play one action following a deterministic policy.
 * Checks the Builders Board / Dragon invariants at each round change.
 */
const playAction = (
  engine: Engine,
  game: GameWithNextAction,
  policy: Policy,
  stats: GameStats,
): GameState => {
  const action = game.nextAction.nextAction;
  const lordId = game.nextAction.nextLord;
  const player = currentPlayer(game);

  switch (action) {
    case playerActions.pickDomino: {
      const unpicked = game.currentDominoes.find((d) => !d.picked)!;
      const next = engine.chooseDomino({
        game,
        lordId,
        dominoPick: unpicked.domino.number,
      });
      if (next.turn !== game.turn && next.queendomino) {
        // New round: Dragon back in its cave, Builders Board refilled
        const board = next.queendomino.buildersBoard;
        expect(next.queendomino.dragonUsedThisRound).toBe(false);
        if (board.drawPile.length > 0) {
          expect(board.slots.every((s) => s !== null)).toBe(true);
        }
      }
      return next;
    }
    case playerActions.placeDomino: {
      const lord = game.lords.find((l) => l.id === lordId)!;
      const placements = engine.getValidPlacements({
        kingdom: player.kingdom,
        domino: lord.dominoPicked!,
        maxKingdomSize: game.rules.basic.maxKingdomSize,
      });
      if (placements.length > 0) {
        return engine.placeDomino({
          game,
          lordId,
          position: placements[0]!.position,
          rotation: placements[0]!.rotation,
        });
      }
      stats.discards++;
      return engine.discardDomino({ game, lordId });
    }
    case playerActions.pass:
      stats.discards++;
      return engine.discardDomino({ game, lordId });
    case playerActions.placeKnight: {
      if (policy.knights) {
        for (const position of game.queendomino?.lastPlacedPositions ?? []) {
          try {
            const next = engine.placeKnight({ game, lordId, position });
            stats.knightsPlaced++;
            return next;
          } catch {
            // territory already taxed or knight limit reached
          }
        }
      }
      return engine.skipOptionalAction({ game, lordId });
    }
    case playerActions.constructBuilding: {
      const square = openConstructionSquares(player)[0];
      const building = affordableBuildings(game, player)[0];
      if (policy.build && square && building) {
        const drawPileBefore = game.queendomino!.buildersBoard.drawPile.length;
        const next = engine.constructBuilding({
          game,
          lordId,
          buildingId: building.id,
          position: square,
        });
        // Official rule: the spot stays empty for the rest of the round
        expect(next.queendomino!.buildersBoard.drawPile).toHaveLength(
          drawPileBefore,
        );
        expect(
          next.queendomino!.buildersBoard.slots.some(
            (s) => s?.id === building.id,
          ),
        ).toBe(false);
        stats.constructions++;
        return next;
      }
      return engine.skipOptionalAction({ game, lordId });
    }
    case playerActions.useDragon: {
      const qd = game.queendomino!;
      // Any building of the board: the Dragon always costs 1 coin
      const target =
        (player.coins ?? 0) >= 1
          ? qd.buildersBoard.slots.find((s) => s !== null)
          : undefined;
      if (
        policy.dragon &&
        target &&
        !qd.dragonUsedThisRound &&
        qd.queenHolderId !== player.id
      ) {
        stats.dragonRounds.push(game.turn);
        return engine.useDragon({ game, lordId, buildingId: target.id });
      }
      return engine.skipOptionalAction({ game, lordId });
    }
    default:
      throw new Error(`Unexpected action ${action}`);
  }
};

const playFullGame = (
  engine: Engine,
  seed: string,
  policy: Policy,
): { game: GameState; stats: GameStats } => {
  let game = startQueenDomino(engine, seed);
  const stats: GameStats = {
    constructions: 0,
    dragonRounds: [],
    knightsPlaced: 0,
    discards: 0,
  };
  let iterations = 0;
  while (isGameWithNextAction(game) && iterations < 1000) {
    iterations++;
    game = playAction(engine, game, policy, stats);
  }
  expect(iterations).toBeLessThan(1000);
  return { game, stats };
};

/** Advance until the given action is reached (skipping/choosing defaults). */
const advanceTo = (
  engine: Engine,
  game: GameState,
  target: string,
  policy: Policy = { knights: false, build: false, dragon: false },
): GameWithNextAction => {
  const stats: GameStats = {
    constructions: 0,
    dragonRounds: [],
    knightsPlaced: 0,
    discards: 0,
  };
  let current = game;
  for (let i = 0; i < 1000; i++) {
    if (!isGameWithNextAction(current)) break;
    if (current.nextAction.nextAction === target) return current;
    current = playAction(engine, current, policy, stats);
  }
  throw new Error(`Action ${target} never reached`);
};

/**
 * Make sure the current player owns a free construction square (turn the first
 * square of the domino just placed into one if needed) and has enough coins.
 */
const withConstructionSquare = (
  g: GameWithNextAction,
): { game: GameWithNextAction; square: Position } => {
  const player = currentPlayer(g);
  const existing = openConstructionSquares(player)[0];
  const square = existing ?? g.queendomino!.lastPlacedPositions![0]!;
  const kingdom = player.kingdom.map((row, y) =>
    row.map((tile, x) =>
      x === square.x && y === square.y && tile.type !== "empty"
        ? { ...tile, hasConstructionSquare: true }
        : tile,
    ),
  );
  return {
    game: {
      ...g,
      players: g.players.map((p) =>
        p.id === player.id ? { ...p, kingdom, coins: 50 } : p,
      ),
    },
    square,
  };
};

const errorCodeOf = (fn: () => unknown): string | undefined => {
  try {
    fn();
  } catch (e) {
    return (e as { code?: string }).code;
  }
  return undefined;
};

describe("Queendomino rules", () => {
  describe("GitHub #3 - getResults applies the Queen and building bonuses", () => {
    test("final score = territories + Queen bonus + buildings end-game scoring + wealth (seeded game)", () => {
      const engine = createGameEngine({});
      const { game, stats } = playFullGame(engine, "qd-results-seed", {
        knights: true,
        build: true,
        dragon: true,
      });

      expect(stats.constructions).toBeGreaterThan(0);
      const queenHolderId = game.queendomino?.queenHolderId ?? null;
      expect(queenHolderId).not.toBeNull();

      const results: GameWithResults = engine.getResults({ game });

      let someBuildingBonus = false;
      for (const player of game.players) {
        const base = engine.calculateScore({ kingdom: player.kingdom }).points;
        const queen =
          player.id === queenHolderId ? getQueenBonus(player.kingdom) : 0;
        const buildings = calculateBuildingEndGameBonus(player);
        if (buildings > 0) someBuildingBonus = true;
        // Wealth: 1 point per 3 unused coins
        const wealth = getWealthPoints(player);

        const result = results.result.find((r) => r.playerId === player.id)!;
        expect(result.details.points).toBe(base + queen + buildings + wealth);
      }
      expect(someBuildingBonus).toBe(true);

      // Non-regression snapshot of the seeded game
      expect(
        results.result.map((r) => ({
          name: r.playerName,
          points: r.details.points,
          position: r.position,
        })),
      ).toMatchInlineSnapshot(`
        [
          {
            "name": "Alice",
            "points": 163,
            "position": 1,
          },
          {
            "name": "Bobby",
            "points": 125,
            "position": 2,
          },
        ]
      `);
    });
  });

  describe("GitHub #4 - Builders Board is refilled", () => {
    test("emptied spots are refilled from the draw pile at each new round", () => {
      const engine = createGameEngine({});
      const { game, stats } = playFullGame(engine, "qd-refill-seed", {
        knights: false,
        build: true,
        dragon: true,
      });

      const board = game.queendomino!.buildersBoard;
      const removed = stats.constructions + stats.dragonRounds.length;
      expect(removed).toBeGreaterThan(6);
      // 18 buildings in total: whatever left the board was replaced from the pile
      const onBoard = board.slots.filter((s) => s !== null).length;
      expect(onBoard + board.drawPile.length + removed).toBe(18);
      expect(board.drawPile.length).toBeLessThan(12);
    });

    test("a built spot stays empty until the end of the round, then is refilled", () => {
      const engine = createGameEngine({});
      // Give the player enough coins and a free construction square
      const prepared = withConstructionSquare(
        advanceTo(
          engine,
          startQueenDomino(engine, "qd-refill-round"),
          playerActions.constructBuilding,
        ),
      );
      const g = prepared.game;
      const square = prepared.square;
      let game: GameState = g;
      const building = g.queendomino!.buildersBoard.slots[0]!;
      const turn = game.turn;
      const drawPile = g.queendomino!.buildersBoard.drawPile.length;

      game = engine.constructBuilding({
        game: game as GameWithNextAction,
        lordId: g.nextAction.nextLord,
        buildingId: building.id,
        position: square!,
      });
      expect(game.queendomino!.buildersBoard.slots[0]).toBeNull();
      expect(game.queendomino!.buildersBoard.drawPile).toHaveLength(drawPile);

      // Play on until the round changes
      while (isGameWithNextAction(game) && game.turn === turn) {
        game = playAction(
          engine,
          game,
          { knights: false, build: false, dragon: false },
          { constructions: 0, dragonRounds: [], knightsPlaced: 0, discards: 0 },
        );
        if (game.turn === turn) {
          expect(game.queendomino!.buildersBoard.slots[0]).toBeNull();
        }
      }
      expect(game.queendomino!.buildersBoard.slots[0]).not.toBeNull();
      expect(game.queendomino!.buildersBoard.drawPile).toHaveLength(
        drawPile - 1,
      );
    });
  });

  describe("GitHub #5 - Dragon, knight bonus, knight placement, discard", () => {
    test("the Dragon can be used again in later rounds, but only once per round", () => {
      const engine = createGameEngine({});
      const { stats } = playFullGame(engine, "qd-dragon-seed", {
        knights: false,
        build: false,
        dragon: true,
      });
      expect(stats.dragonRounds.length).toBeGreaterThan(1);
      expect(new Set(stats.dragonRounds).size).toBe(stats.dragonRounds.length);
    });

    test("a second Dragon use in the same round is rejected", () => {
      const engine = createGameEngine({});
      let game: GameState = advanceTo(
        engine,
        startQueenDomino(engine, "qd-dragon-twice"),
        playerActions.useDragon,
      );
      const turn = game.turn;
      const first = game as GameWithNextAction;
      game = engine.useDragon({
        game: first,
        lordId: first.nextAction.nextLord,
        buildingId: first.queendomino!.buildersBoard.slots.find(
          (s) => s !== null,
        )!.id,
      });
      expect(game.queendomino!.dragonUsedThisRound).toBe(true);

      const second = advanceTo(engine, game, playerActions.useDragon);
      expect(second.turn).toBe(turn);
      expect(
        errorCodeOf(() =>
          engine.useDragon({
            game: second,
            lordId: second.nextAction.nextLord,
            buildingId: second.queendomino!.buildersBoard.slots.find(
              (s) => s !== null,
            )!.id,
          }),
        ),
      ).toBe("DRAGON_UNAVAILABLE");
    });

    test("a building with a knight immediate bonus grants an extra knight", () => {
      const engine = createGameEngine({});
      const { game: g, square } = withConstructionSquare(
        advanceTo(
          engine,
          startQueenDomino(engine, "qd-knight-bonus"),
          playerActions.constructBuilding,
        ),
      );
      const player = currentPlayer(g);
      const barracks: BuildingTile = {
        id: 99,
        name: "Test Barracks",
        cost: 2,
        crowns: 0,
        towers: 0,
        immediateBonus: { type: "knight", amount: 1 },
      };
      const game: GameWithNextAction = {
        ...g,
        queendomino: {
          ...g.queendomino!,
          buildersBoard: {
            ...g.queendomino!.buildersBoard,
            slots: [barracks, ...g.queendomino!.buildersBoard.slots.slice(1)],
          },
        },
      };

      expect(engine.getMaxKnights({ game, playerId: player.id })).toBe(1);
      const next = engine.constructBuilding({
        game,
        lordId: g.nextAction.nextLord,
        buildingId: 99,
        position: square,
      });
      const updated = next.players.find((p) => p.id === player.id)!;
      expect(updated.bonusKnights).toBe(1);
      expect(engine.getMaxKnights({ game: next, playerId: player.id })).toBe(2);
      // The price is the cost of the spot (5 for the first spot), not the
      // tile's own cost
      const price = g.queendomino!.queenHolderId === player.id ? 4 : 5;
      expect(updated.coins).toBe((player.coins ?? 0) - price);
    });

    test("a knight can only be placed on the domino just placed", () => {
      const engine = createGameEngine({});
      // Reach a placeKnight action with at least one older domino in the kingdom
      const countTiles = (p: Player) =>
        p.kingdom
          .flat()
          .filter((t) => t.type !== "empty" && t.type !== "castle").length;
      let game: GameState = startQueenDomino(engine, "qd-knight-position");
      let g = advanceTo(engine, game, playerActions.placeKnight);
      while (countTiles(currentPlayer(g)) <= 2) {
        game = engine.skipOptionalAction({
          game: g,
          lordId: g.nextAction.nextLord,
        });
        g = advanceTo(engine, game, playerActions.placeKnight);
      }
      const player = currentPlayer(g);
      const justPlaced = g.queendomino!.lastPlacedPositions!;
      expect(justPlaced).toHaveLength(2);

      // Any other square of the kingdom is refused
      const isJustPlaced = (x: number, y: number) =>
        justPlaced.some((p) => p.x === x && p.y === y);
      let older: Position | undefined;
      player.kingdom.forEach((row, y) => {
        row.forEach((tile, x) => {
          if (
            !older &&
            tile.type !== "empty" &&
            tile.type !== "castle" &&
            !isJustPlaced(x, y)
          ) {
            older = { x, y };
          }
        });
      });
      expect(older).toBeDefined();
      expect(
        errorCodeOf(() =>
          engine.placeKnight({
            game: g,
            lordId: g.nextAction.nextLord,
            position: older!,
          }),
        ),
      ).toBe("CANNOT_PLACE_KNIGHT");

      // A square of the domino just placed is accepted
      const next = engine.placeKnight({
        game: g,
        lordId: g.nextAction.nextLord,
        position: justPlaced[0]!,
      });
      const knights = next.players.find((p) => p.id === player.id)!.knights!;
      expect(knights.at(-1)?.position).toEqual(justPlaced[0]);
    });

    test("a player who discards skips the knight but may still build and use the Dragon", () => {
      const engine = createGameEngine({});
      let game: GameState = startQueenDomino(engine, "qd-discard");
      const g = advanceTo(engine, game, playerActions.placeDomino);
      const lordId = g.nextAction.nextLord;
      // Force a domino that cannot fit: fill the kingdom limits artificially by
      // using a pass-able state (domino that has no valid placement).
      const lord = g.lords.find((l) => l.id === lordId)!;
      const player = currentPlayer(g);
      const blockedKingdom = player.kingdom.map((row) =>
        row.map((tile) =>
          tile.type === "castle"
            ? tile
            : { type: "empty" as const, crowns: 0 as const },
        ),
      );
      // Surround the castle with a 5x5 frame of tiles that block the domino
      const castleY = blockedKingdom.findIndex((row) =>
        row.some((t) => t.type === "castle"),
      );
      const castleX = blockedKingdom[castleY]!.findIndex(
        (t) => t.type === "castle",
      );
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (dx === 0 && dy === 0) continue;
          blockedKingdom[castleY + dy]![castleX + dx] = {
            type: "volcano",
            crowns: 0,
          };
        }
      }
      game = {
        ...g,
        players: g.players.map((p) =>
          p.id === player.id ? { ...p, kingdom: blockedKingdom } : p,
        ),
      };
      expect(
        engine.getValidPlacements({
          kingdom: blockedKingdom,
          domino: lord.dominoPicked!,
        }),
      ).toHaveLength(0);

      const afterDiscard = engine.discardDomino({
        game: game as GameWithNextAction,
        lordId,
      });
      if (!isGameWithNextAction(afterDiscard))
        throw new Error("expected action");
      expect(afterDiscard.nextAction.nextAction).toBe(
        playerActions.constructBuilding,
      );
      expect(afterDiscard.nextAction.nextLord).toBe(lordId);
      expect(afterDiscard.queendomino!.lastPlacedPositions).toEqual([]);

      const afterBuildSkip = engine.skipOptionalAction({
        game: afterDiscard,
        lordId,
      });
      if (!isGameWithNextAction(afterBuildSkip))
        throw new Error("expected action");
      expect(afterBuildSkip.nextAction.nextAction).toBe(
        playerActions.useDragon,
      );

      const afterDragonSkip = engine.skipOptionalAction({
        game: afterBuildSkip,
        lordId,
      });
      if (!isGameWithNextAction(afterDragonSkip))
        throw new Error("expected action");
      expect(afterDragonSkip.nextAction.nextAction).toBe(
        playerActions.pickDomino,
      );
      expect(afterDragonSkip.nextAction.nextLord).toBe(lordId);
    });
  });
});
