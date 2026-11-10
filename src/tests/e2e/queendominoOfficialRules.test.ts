/**
 * Queendomino rules aligned on the official rulebook (Blue Orange, 2017),
 * GitHub #26: Dragon cost, the Queen (tie and discount), Wealth, knight tax,
 * knights per turn / per territory, the 6-spot Builders' Board and the
 * 2-player 7x7 setup. Every rule is checked in QueenDomino and, where the
 * mode shares it, in AgeOfGiants-QueenDomino.
 */
import type { BuildingTile } from "@core/domain/types/building.js";
import {
  type GameState,
  type GameWithNextAction,
  isGameWithNextAction,
} from "@core/domain/types/game.js";
import type { Kingdom, Position } from "@core/domain/types/kingdom.js";
import { type Player, playerActions } from "@core/domain/types/player.js";
import { localeTranslations, TranslationKey } from "@core/i18n/translations.js";
import { describe, expect, test } from "vitest";
import { createGameEngine } from "../../index.js";

const engine = createGameEngine({});
const QD_MODES = ["QueenDomino", "AgeOfGiants-QueenDomino"] as const;

const currentPlayer = (game: GameWithNextAction): Player => {
  const lord = game.lords.find((l) => l.id === game.nextAction.nextLord)!;
  return game.players.find((p) => p.id === lord.playerId)!;
};

const start = (
  mode: string,
  seed: string,
  players: string[] = ["Alice", "Bobby"],
  extraRules?: string[],
): GameState => {
  let game: GameState = engine.createGame({ mode, seed });
  game = engine.addPlayers({ game, players });
  if (extraRules) game = engine.addExtraRules({ game, extraRules });
  return engine.startGame({ game });
};

/**
 * Plays one step with a default policy: first domino, first placement, every
 * optional action skipped, giants on their first valid crown.
 */
const step = (g: GameWithNextAction): GameState => {
  const lordId = g.nextAction.nextLord;
  switch (g.nextAction.nextAction) {
    case playerActions.pickDomino:
      return engine.chooseDomino({
        game: g,
        lordId,
        dominoPick: g.currentDominoes.find((d) => !d.picked)!.domino.number,
      });
    case playerActions.placeDomino:
    case playerActions.pass: {
      const lord = g.lords.find((l) => l.id === lordId)!;
      const placements = lord.dominoPicked
        ? engine.getValidPlacements({
            kingdom: currentPlayer(g).kingdom,
            domino: lord.dominoPicked,
            maxKingdomSize: g.rules.basic.maxKingdomSize,
          })
        : [];
      return g.nextAction.nextAction === playerActions.placeDomino &&
        placements.length > 0
        ? engine.placeDomino({
            game: g,
            lordId,
            position: placements[0]!.position,
            rotation: placements[0]!.rotation,
          })
        : engine.discardDomino({ game: g, lordId });
    }
    case playerActions.placeGiant:
      return engine.placeGiant({
        game: g,
        lordId,
        position: engine.getValidGiantPositions({ game: g })[0]!,
      });
    default:
      return engine.skipOptionalAction({ game: g, lordId });
  }
};

/** Plays default steps until `target` is the action to play. */
const advanceTo = (game: GameState, target: string): GameWithNextAction => {
  let current = game;
  for (let i = 0; i < 3000 && isGameWithNextAction(current); i++) {
    if (current.nextAction.nextAction === target) return current;
    current = step(current);
  }
  throw new Error(`Action ${target} never reached`);
};

/** Plays default steps until the end of the game. */
const playToEnd = (game: GameState): GameState => {
  let current = game;
  for (let i = 0; i < 5000 && isGameWithNextAction(current); i++) {
    current = step(current);
  }
  return current;
};

/** Replaces the current player with `update(player)`. */
const withCurrentPlayer = (
  game: GameWithNextAction,
  update: (player: Player) => Player,
): GameWithNextAction => {
  const player = currentPlayer(game);
  return {
    ...game,
    players: game.players.map((p) => (p.id === player.id ? update(p) : p)),
  };
};

/** Turns `square` of the kingdom into a free construction square. */
const withConstructionSquareAt = (kingdom: Kingdom, square: Position) =>
  kingdom.map((row, y) =>
    row.map((tile, x) =>
      x === square.x && y === square.y && tile.type !== "empty"
        ? { ...tile, hasConstructionSquare: true }
        : tile,
    ),
  );

const tile = (id: number, extra: Partial<BuildingTile> = {}): BuildingTile => ({
  id,
  name: `Building ${id}`,
  cost: 3,
  crowns: 0,
  towers: 0,
  ...extra,
});

/** A constructBuilding state with a free construction square and `coins`. */
const constructionState = (
  mode: string,
  seed: string,
  coins: number,
  slots?: (BuildingTile | null)[],
): { game: GameWithNextAction; square: Position } => {
  const g = advanceTo(start(mode, seed), playerActions.constructBuilding);
  const square =
    g.queendomino!.lastPlacedPositions?.[0] ??
    // the lord discarded: take any square of the kingdom
    currentPlayer(g).kingdom.flatMap((row, y) =>
      row.flatMap((t, x) =>
        t.type !== "empty" && t.type !== "castle" ? [{ x, y }] : [],
      ),
    )[0]!;
  let game = withCurrentPlayer(g, (p) => ({
    ...p,
    coins,
    buildings: [],
    kingdom: withConstructionSquareAt(p.kingdom, square),
  }));
  if (slots) {
    game = {
      ...game,
      queendomino: {
        ...game.queendomino!,
        buildersBoard: { ...game.queendomino!.buildersBoard, slots },
      },
    };
  }
  return { game, square };
};

const errorCodeOf = (fn: () => unknown): string | undefined => {
  try {
    fn();
  } catch (e) {
    return (e as { code?: string }).code;
  }
  return undefined;
};

describe.each(QD_MODES)("%s — official rules (GitHub #26)", (mode) => {
  describe("Builders' Board: 6 spots, the cost is carried by the spot", () => {
    test("starts with 6 buildings on spots costing 5, 4, 3, 2, 1 and 0", () => {
      const game = start(mode, "board-setup");
      const board = game.queendomino!.buildersBoard;
      expect(board.slots).toHaveLength(6);
      expect(board.slots.every((s) => s !== null)).toBe(true);
      expect(board.slotCosts).toEqual([5, 4, 3, 2, 1, 0]);
      // 18 building tiles in the data: 6 on the board, 12 in the draw pile
      expect(board.drawPile).toHaveLength(12);
    });

    test("a building costs the price of its spot, whatever its own cost", () => {
      const cheapTile = tile(101, { cost: 1 });
      const dearTile = tile(102, { cost: 6 });
      const { game, square } = constructionState(mode, "spot-price", 4, [
        cheapTile, // 5-coin spot
        null,
        null,
        null,
        null,
        dearTile, // free spot
      ]);
      const lordId = game.nextAction.nextLord;
      const playerId = currentPlayer(game).id;
      const isHost = game.queendomino!.queenHolderId === playerId;

      expect(engine.getAffordableBuildings({ game }).map((b) => b.id)).toEqual(
        isHost ? [101, 102] : [102],
      );
      const built = engine.constructBuilding({
        game,
        lordId,
        buildingId: 102,
        position: square,
      });
      expect(built.players.find((p) => p.id === playerId)!.coins).toBe(4);
      if (!isHost) {
        expect(
          errorCodeOf(() =>
            engine.constructBuilding({
              game,
              lordId,
              buildingId: 101,
              position: square,
            }),
          ),
        ).toBe("CANNOT_AFFORD_BUILDING");
      }
    });

    test("at a new round the remaining buildings slide to the cheapest spots", () => {
      const g = advanceTo(start(mode, "slide"), playerActions.useDragon);
      const turn = g.turn;
      const board = g.queendomino!.buildersBoard;
      // Empty the two cheapest spots (as if built this round)
      const remaining = board.slots.slice(0, 4);
      const game: GameWithNextAction = {
        ...g,
        queendomino: {
          ...g.queendomino!,
          buildersBoard: { ...board, slots: [...remaining, null, null] },
        },
      };
      // Nobody builds nor burns until the round changes
      let next: GameState = game;
      while (isGameWithNextAction(next) && next.turn === turn) {
        next = step(next);
      }
      const refilled = next.queendomino!.buildersBoard;
      expect(next.turn).toBe(turn + 1);
      // The 4 remaining buildings now sit on the 4 cheapest spots, in order
      expect(refilled.slots.slice(2).map((s) => s?.id)).toEqual(
        remaining.map((s) => s?.id),
      );
      // The 2 expensive spots are filled from the draw pile
      expect(refilled.slots.slice(0, 2).map((s) => s?.id)).toEqual(
        board.drawPile
          .slice(0, 2)
          .reverse()
          .map((b) => b.id),
      );
      expect(refilled.drawPile).toHaveLength(board.drawPile.length - 2);
    });
  });

  describe("The Queen", () => {
    test("goes to the player who reaches the most towers, even on a tie", () => {
      const tower = tile(201, { towers: 1 });
      const { game: g, square } = constructionState(mode, "queen-tie", 10, [
        tower,
        null,
        null,
        null,
        null,
        null,
      ]);
      const builder = currentPlayer(g);
      const opponent = g.players.find((p) => p.id !== builder.id)!;
      // The opponent hosts the Queen with 1 tower; the builder has none
      const game: GameWithNextAction = {
        ...g,
        players: g.players.map((p) =>
          p.id === builder.id
            ? { ...p, towers: 0 }
            : p.id === opponent.id
              ? { ...p, towers: 1 }
              : p,
        ),
        queendomino: { ...g.queendomino!, queenHolderId: opponent.id },
      };

      const next = engine.constructBuilding({
        game,
        lordId: game.nextAction.nextLord,
        buildingId: 201,
        position: square,
      });
      // 1 tower each: the builder reaches the tie and takes the Queen
      expect(next.players.find((p) => p.id === builder.id)!.towers).toBe(1);
      expect(next.queendomino!.queenHolderId).toBe(builder.id);
    });

    test("stays with her host while another player has fewer towers", () => {
      const plain = tile(202);
      const { game: g, square } = constructionState(mode, "queen-stays", 10, [
        null,
        null,
        null,
        null,
        null,
        plain,
      ]);
      const builder = currentPlayer(g);
      const opponent = g.players.find((p) => p.id !== builder.id)!;
      const game: GameWithNextAction = {
        ...g,
        players: g.players.map((p) =>
          p.id === opponent.id ? { ...p, towers: 2 } : { ...p, towers: 1 },
        ),
        queendomino: { ...g.queendomino!, queenHolderId: opponent.id },
      };
      const next = engine.constructBuilding({
        game,
        lordId: game.nextAction.nextLord,
        buildingId: 202,
        position: square,
      });
      expect(next.queendomino!.queenHolderId).toBe(opponent.id);
    });

    test("lowers her host's construction costs by 1 coin (never below 0)", () => {
      const expensive = tile(203);
      const free = tile(204);
      const one = tile(205);
      const { game: g, square } = constructionState(mode, "queen-discount", 4, [
        expensive, // 5 coins, 4 for the host
        null,
        null,
        null,
        one, // 1 coin, free for the host
        free, // free
      ]);
      const host = currentPlayer(g);
      const game: GameWithNextAction = {
        ...g,
        queendomino: { ...g.queendomino!, queenHolderId: host.id },
      };
      const lordId = game.nextAction.nextLord;

      expect(engine.getAffordableBuildings({ game }).map((b) => b.id)).toEqual([
        203, 205, 204,
      ]);
      const coinsAfter = (buildingId: number) =>
        engine
          .constructBuilding({ game, lordId, buildingId, position: square })
          .players.find((p) => p.id === host.id)!.coins;
      expect(coinsAfter(203)).toBe(0);
      expect(coinsAfter(205)).toBe(4);
      expect(coinsAfter(204)).toBe(4);

      // Without the Queen the 5-coin spot is out of reach with 4 coins
      const noQueen: GameWithNextAction = {
        ...game,
        queendomino: { ...game.queendomino!, queenHolderId: null },
      };
      expect(
        engine.getAffordableBuildings({ game: noQueen }).map((b) => b.id),
      ).toEqual([205, 204]);
    });
  });

  describe("The Dragon", () => {
    test("costs 1 coin, whatever the building burnt", () => {
      const g = advanceTo(start(mode, "dragon-cost"), playerActions.useDragon);
      const game = withCurrentPlayer(g, (p) => ({ ...p, coins: 1 }));
      const player = currentPlayer(game);
      // Not hosting the Queen
      const usable: GameWithNextAction = {
        ...game,
        queendomino: { ...game.queendomino!, queenHolderId: null },
      };
      const board = usable.queendomino!.buildersBoard;
      const expensive = board.slots[0]!;

      const targets = engine.getValidDragonTargets({ game: usable });
      expect(targets.map((b) => b.id)).toEqual(
        board.slots.flatMap((s) => (s ? [s.id] : [])),
      );

      const next = engine.useDragon({
        game: usable,
        lordId: usable.nextAction.nextLord,
        buildingId: expensive.id,
      });
      expect(next.players.find((p) => p.id === player.id)!.coins).toBe(0);
      expect(next.queendomino!.buildersBoard.slots[0]).toBeNull();
      expect(next.queendomino!.dragonUsedThisRound).toBe(true);
    });

    test("has no target without a coin, for the Queen's host, or once used", () => {
      const g = advanceTo(start(mode, "dragon-none"), playerActions.useDragon);
      const player = currentPlayer(g);
      const usable: GameWithNextAction = {
        ...g,
        queendomino: { ...g.queendomino!, queenHolderId: null },
      };
      const noCoin = withCurrentPlayer(usable, (p) => ({ ...p, coins: 0 }));
      expect(engine.getValidDragonTargets({ game: noCoin })).toEqual([]);

      const host: GameWithNextAction = {
        ...usable,
        queendomino: { ...usable.queendomino!, queenHolderId: player.id },
      };
      expect(engine.getValidDragonTargets({ game: host })).toEqual([]);
      expect(
        errorCodeOf(() =>
          engine.useDragon({
            game: host,
            lordId: host.nextAction.nextLord,
            buildingId: host.queendomino!.buildersBoard.slots[0]!.id,
          }),
        ),
      ).toBe("QUEEN_HOLDER_CANNOT_USE_DRAGON");

      const used: GameWithNextAction = {
        ...usable,
        queendomino: { ...usable.queendomino!, dragonUsedThisRound: true },
      };
      expect(engine.getValidDragonTargets({ game: used })).toEqual([]);
    });
  });

  describe("Knights", () => {
    test("each player starts with a single knight and 7 coins", () => {
      let game: GameState = engine.createGame({ mode, seed: "knights" });
      game = engine.addPlayers({ game, players: ["Alice", "Bobby"] });
      for (const player of game.players) {
        expect(player.coins).toBe(7);
        expect(player.knights).toEqual([]);
        expect(player.bonusKnights ?? 0).toBe(0);
      }
    });

    test("tax = 1 coin per square of the territory, construction square or not", () => {
      const g = advanceTo(start(mode, "knight-tax"), playerActions.placeKnight);
      const [square] = g.queendomino!.lastPlacedPositions!;
      const player = currentPlayer(g);
      const terrain = player.kingdom[square!.y]![square!.x]!.type;
      // Size of the territory of `square` (flood fill)
      const seen = new Set<string>();
      const stack = [square!];
      while (stack.length > 0) {
        const { x, y } = stack.pop()!;
        const k = `${x},${y}`;
        if (seen.has(k) || player.kingdom[y]?.[x]?.type !== terrain) continue;
        seen.add(k);
        stack.push(
          { x: x + 1, y },
          { x: x - 1, y },
          { x, y: y + 1 },
          { x, y: y - 1 },
        );
      }

      const next = engine.placeKnight({
        game: g,
        lordId: g.nextAction.nextLord,
        position: square!,
      });
      const after = next.players.find((p) => p.id === player.id)!;
      expect(after.coins).toBe((player.coins ?? 0) + seen.size);
    });

    test("up to 2 knights per turn, one on each square of the domino just placed", () => {
      const g = advanceTo(
        start(mode, "two-knights"),
        playerActions.placeKnight,
      );
      const lordId = g.nextAction.nextLord;
      const [first, second] = g.queendomino!.lastPlacedPositions!;
      // A second knight, granted by a building bonus
      const game = withCurrentPlayer(g, (p) => ({ ...p, bonusKnights: 1 }));
      expect(engine.getValidKnightPositions({ game })).toEqual([first, second]);

      const afterFirst = engine.placeKnight({ game, lordId, position: first! });
      if (!isGameWithNextAction(afterFirst)) throw new Error("expected action");
      // Still placeKnight: the other square can receive the second knight
      expect(afterFirst.nextAction.nextAction).toBe(playerActions.placeKnight);
      expect(engine.getValidKnightPositions({ game: afterFirst })).toEqual([
        second,
      ]);
      expect(
        errorCodeOf(() =>
          engine.placeKnight({ game: afterFirst, lordId, position: first! }),
        ),
      ).toBe("CANNOT_PLACE_KNIGHT");

      const afterSecond = engine.placeKnight({
        game: afterFirst,
        lordId,
        position: second!,
      });
      if (!isGameWithNextAction(afterSecond))
        throw new Error("expected action");
      expect(afterSecond.nextAction.nextAction).toBe(
        playerActions.constructBuilding,
      );
      expect(currentPlayer(afterSecond).knights).toHaveLength(2);

      // The second knight can also be declined
      const skipped = engine.skipOptionalAction({ game: afterFirst, lordId });
      if (!isGameWithNextAction(skipped)) throw new Error("expected action");
      expect(skipped.nextAction.nextAction).toBe(
        playerActions.constructBuilding,
      );
    });

    test("with its single knight placed, the player moves on to construction", () => {
      const g = advanceTo(start(mode, "one-knight"), playerActions.placeKnight);
      const lordId = g.nextAction.nextLord;
      const [square] = g.queendomino!.lastPlacedPositions!;
      const next = engine.placeKnight({ game: g, lordId, position: square! });
      if (!isGameWithNextAction(next)) throw new Error("expected action");
      expect(next.nextAction.nextAction).toBe(playerActions.constructBuilding);

      // Next turns: no knight left, none can be placed
      const later = advanceTo(
        engine.skipOptionalAction({ game: next, lordId }),
        playerActions.placeKnight,
      );
      if (currentPlayer(later).id === currentPlayer(g).id) {
        expect(engine.getValidKnightPositions({ game: later })).toEqual([]);
      }
    });

    test("several knights may tax the same territory", () => {
      const g = advanceTo(
        start(mode, "same-territory"),
        playerActions.placeKnight,
      );
      const justPlaced = g.queendomino!.lastPlacedPositions!;
      const square = justPlaced[0]!;
      const player = currentPlayer(g);
      const terrain = player.kingdom[square.y]![square.x]!.type;
      // An older square of the same territory, next to `square`, already
      // holds a knight (placed in a previous round)
      const older = [
        { x: square.x + 1, y: square.y },
        { x: square.x - 1, y: square.y },
        { x: square.x, y: square.y + 1 },
        { x: square.x, y: square.y - 1 },
      ].find(
        (n) =>
          player.kingdom[n.y]?.[n.x] !== undefined &&
          player.kingdom[n.y]![n.x]!.type !== "castle" &&
          !justPlaced.some((q) => q.x === n.x && q.y === n.y),
      )!;
      const game = withCurrentPlayer(g, (p) => ({
        ...p,
        kingdom: p.kingdom.map((row, y) =>
          row.map((t, x) =>
            x === older.x && y === older.y
              ? { type: terrain, crowns: 0 as const }
              : t,
          ),
        ),
        bonusKnights: 1,
        knights: [{ playerId: p.id, position: older }],
      }));

      expect(engine.getValidKnightPositions({ game })).toContainEqual(square);
      const next = engine.placeKnight({
        game,
        lordId: game.nextAction.nextLord,
        position: square,
      });
      expect(currentPlayer(next as GameWithNextAction).knights).toHaveLength(2);
    });
  });

  describe("Wealth: 1 point for every 3 unused coins", () => {
    test("is a dedicated bonus of the score breakdown, translated in EN and FR", () => {
      const g = advanceTo(start(mode, "wealth"), playerActions.placeKnight);
      const player = currentPlayer(g);
      const game = withCurrentPlayer(g, (p) => ({ ...p, coins: 11 }));
      const score = engine.calculatePlayerScore({ game, playerId: player.id });
      const wealth = score.breakdown.bonuses.find((b) => b.type === "wealth");
      expect(wealth).toEqual({
        type: "wealth",
        label: TranslationKey.SCORE_WEALTH,
        points: 3,
        provisional: true,
      });
      expect(localeTranslations.en[TranslationKey.SCORE_WEALTH]).toBe("Wealth");
      expect(localeTranslations.fr[TranslationKey.SCORE_WEALTH]).toBe(
        "Richesse",
      );
    });
  });
});

describe("2-player setup: 7x7 kingdom with every domino", () => {
  test("QueenDomino at 2 players plays 12 rounds with the 48 dominoes", () => {
    let game: GameState = engine.createGame({ mode: "QueenDomino" });
    game = engine.addPlayers({ game, players: ["Alice", "Bobby"] });
    expect(game.rules.basic).toEqual({
      lords: 2,
      maxDominoes: 48,
      dominoesPerTurn: 4,
      maxTurns: 12,
      maxKingdomSize: 7,
    });
    expect(game.dominoes).toHaveLength(48);
  });

  test("AgeOfGiants-QueenDomino at 2 players plays 12 rounds with the 60 dominoes", () => {
    let game: GameState = engine.createGame({
      mode: "AgeOfGiants-QueenDomino",
    });
    game = engine.addPlayers({ game, players: ["Alice", "Bobby"] });
    expect(game.rules.basic).toEqual({
      lords: 2,
      maxDominoes: 60,
      dominoesPerTurn: 5,
      maxTurns: 12,
      maxKingdomSize: 7,
      dominoesDiscardedPerTurn: 1,
    });
    expect(game.dominoes).toHaveLength(60);
  });

  test.each([
    ["QueenDomino", 3],
    ["QueenDomino", 4],
    ["AgeOfGiants-QueenDomino", 3],
    ["AgeOfGiants-QueenDomino", 4],
    ["Classic", 2],
    ["AgeOfGiants", 2],
  ])("%s at %i players keeps a 5x5 kingdom", (mode, count) => {
    let game: GameState = engine.createGame({ mode });
    game = engine.addPlayers({
      game,
      players: ["Alice", "Bobby", "Carol", "David"].slice(0, count),
    });
    expect(game.rules.basic.maxKingdomSize).toBe(5);
  });

  test("The Mighty Duel is still accepted in QueenDomino, without further effect", () => {
    const setup = (extraRules?: string[]) => {
      let game: GameState = engine.createGame({
        mode: "QueenDomino",
        seed: "duel",
      });
      game = engine.addPlayers({ game, players: ["Alice", "Bobby"] });
      expect(
        engine
          .getExtraRules({ mode: "QueenDomino", players: 2 })
          .map((r) => r.name),
      ).toContain("The Mighty Duel");
      if (extraRules) game = engine.addExtraRules({ game, extraRules });
      return game;
    };
    const plain = setup();
    const duel = setup(["The Mighty Duel"]);
    expect(duel.rules.extra.map((r) => r.name)).toEqual(["The Mighty Duel"]);
    expect(duel.rules.basic).toEqual(plain.rules.basic);
    // Same dominoes in the same order: the rule changes nothing
    expect(duel.dominoes.map((d) => d.number)).toEqual(
      plain.dominoes.map((d) => d.number),
    );
  });

  test.each(
    QD_MODES,
  )("a complete %s 2-player game builds kingdoms wider than 5x5", (mode) => {
    const game = playToEnd(start(mode, "full-7x7"));
    expect(isGameWithNextAction(game)).toBe(false);
    expect(game.turn).toBe(12);
    const widths = game.players.map((p) => {
      const xs = p.kingdom.flatMap((row) =>
        row.flatMap((t, x) => (t.type === "empty" ? [] : [x])),
      );
      const ys = p.kingdom.flatMap((row, y) =>
        row.some((t) => t.type !== "empty") ? [y] : [],
      );
      return Math.max(
        Math.max(...xs) - Math.min(...xs) + 1,
        Math.max(...ys) - Math.min(...ys) + 1,
      );
    });
    expect(Math.max(...widths)).toBeGreaterThan(5);
    expect(Math.max(...widths)).toBeLessThanOrEqual(7);
    // Final results include the Wealth of every player
    for (const result of engine.getResults({ game }).result) {
      expect(result.breakdown?.bonuses.some((b) => b.type === "wealth")).toBe(
        true,
      );
    }
  });
});
