/**
 * Prices of the Queendomino actions (GitHub #39): `getBuildingPrice`,
 * `getBuildersBoardPrices` and `getDragonPrice` return exactly the coins that
 * `constructBuilding` and `useDragon` debit, so a client never recomputes the
 * spot cost or the Queen's discount.
 */
import { ErrorCode, NotFoundError } from "@core/domain/errors/domainErrors.js";
import type { BuildingTile } from "@core/domain/types/building.js";
import {
  type GameState,
  type GameWithNextAction,
  isGameWithNextAction,
} from "@core/domain/types/game.js";
import { type Player, playerActions } from "@core/domain/types/player.js";
import { wrapWithActionLog } from "@core/useCases/gameActionLog.js";
import { wrapWithDebug } from "@core/useCases/gameDebug.js";
import { wrapWithEvents } from "@core/useCases/gameEvents.js";
import { describe, expect, test } from "vitest";
import { createGameEngine } from "../../index.js";

const engine = createGameEngine({});

const MODES = ["QueenDomino", "AgeOfGiants-QueenDomino"] as const;
const SEEDS = Array.from({ length: 8 }, (_, i) => `prices-${i}`);

const start = (mode: string, seed: string): GameState => {
  let game: GameState = engine.createGame({ mode, seed });
  game = engine.addPlayers({ game, players: ["Alice", "Bobby", "Carol"] });
  return engine.startGame({ game });
};

const currentPlayer = (game: GameWithNextAction): Player => {
  const lord = game.lords.find((l) => l.id === game.nextAction.nextLord)!;
  return game.players.find((p) => p.id === lord.playerId)!;
};

const playerById = (game: GameState, playerId: string): Player =>
  game.players.find((p) => p.id === playerId)!;

const coinsOf = (game: GameState, playerId: string): number =>
  playerById(game, playerId).coins ?? 0;

/** Coins granted back by the immediate bonus of a building. */
const bonusCoins = (building: BuildingTile): number =>
  building.immediateBonus?.type === "coins"
    ? building.immediateBonus.amount
    : 0;

const rng = (seed: string) => {
  let a = [...seed].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 31), 7);
  return (n: number): number => {
    a = (Math.imul(a, 1103515245) + 12345) >>> 0;
    return a % n;
  };
};

type Coverage = {
  constructions: number;
  queenHostConstructions: number;
  freeConstructions: number;
  dragons: number;
};

/**
 * Plays a complete seeded game, constructing a building whenever possible
 * (varied choice of spot) and using the Dragon whenever possible, and checks
 * at every action that the advertised price is the number of coins debited.
 */
const playAndCheckPrices = (mode: string, seed: string): Coverage => {
  const pick = rng(`${mode}/${seed}`);
  const coverage: Coverage = {
    constructions: 0,
    queenHostConstructions: 0,
    freeConstructions: 0,
    dragons: 0,
  };
  let game = start(mode, seed);

  for (let i = 0; i < 2000 && isGameWithNextAction(game); i++) {
    const g: GameWithNextAction = game;
    const lordId = g.nextAction.nextLord;
    const player = currentPlayer(g);

    switch (g.nextAction.nextAction) {
      case playerActions.pickDomino: {
        const free = g.currentDominoes.filter((d) => !d.picked);
        game = engine.chooseDomino({
          game: g,
          lordId,
          dominoPick: free[pick(free.length)]!.domino.number,
        });
        break;
      }
      case playerActions.placeDomino:
      case playerActions.pass: {
        const lord = g.lords.find((l) => l.id === lordId)!;
        const placements = lord.dominoPicked
          ? engine.getValidPlacements({
              kingdom: player.kingdom,
              domino: lord.dominoPicked,
              maxKingdomSize: g.rules.basic.maxKingdomSize,
            })
          : [];
        game =
          g.nextAction.nextAction === playerActions.placeDomino &&
          placements.length > 0
            ? engine.placeDomino({
                game: g,
                lordId,
                ...placements[pick(placements.length)]!,
              })
            : engine.discardDomino({ game: g, lordId });
        break;
      }
      case playerActions.placeGiant:
        game = engine.placeGiant({
          game: g,
          lordId,
          position: engine.getValidGiantPositions({ game: g })[0]!,
        });
        break;
      case playerActions.placeKnight: {
        const [position] = engine.getValidKnightPositions({ game: g });
        game = position
          ? engine.placeKnight({ game: g, lordId, position })
          : engine.skipOptionalAction({ game: g, lordId });
        break;
      }
      case playerActions.constructBuilding: {
        const board = g.queendomino!.buildersBoard;
        const boardPrices = engine.getBuildersBoardPrices({
          game: g,
          playerId: player.id,
        });
        // One price per building of the board, as getBuildingPrice gives it
        expect(boardPrices.map((p) => p.buildingId)).toEqual(
          board.slots.flatMap((slot) => (slot ? [slot.id] : [])),
        );
        for (const entry of boardPrices) {
          expect(board.slots[entry.slotIndex]?.id).toBe(entry.buildingId);
          expect(
            engine.getBuildingPrice({
              game: g,
              playerId: player.id,
              buildingId: entry.buildingId,
            }),
          ).toBe(entry.price);
        }

        const affordable = engine.getAffordableBuildings({ game: g });
        const positions = engine.getValidBuildingPositions({ game: g });
        // getAffordableBuildings keeps exactly the buildings the player can pay
        if (positions.length > 0) {
          expect(affordable.map((b) => b.id)).toEqual(
            boardPrices
              .filter((p) => p.price <= (player.coins ?? 0))
              .map((p) => p.buildingId),
          );
        }
        if (affordable.length === 0 || positions.length === 0) {
          game = engine.skipOptionalAction({ game: g, lordId });
          break;
        }

        const building = affordable[pick(affordable.length)]!;
        const price = engine.getBuildingPrice({
          game: g,
          playerId: player.id,
          buildingId: building.id,
        })!;
        const isQueenHost = g.queendomino!.queenHolderId === player.id;
        const before = coinsOf(g, player.id);
        game = engine.constructBuilding({
          game: g,
          lordId,
          buildingId: building.id,
          position: positions[pick(positions.length)]!,
        });
        expect(before - coinsOf(game, player.id) + bonusCoins(building)).toBe(
          price,
        );

        coverage.constructions++;
        if (isQueenHost) coverage.queenHostConstructions++;
        if (price === 0) coverage.freeConstructions++;
        break;
      }
      case playerActions.useDragon: {
        const targets = engine.getValidDragonTargets({ game: g });
        const price = engine.getDragonPrice({ game: g, playerId: player.id });
        if (targets.length === 0 || pick(2) === 0) {
          game = engine.skipOptionalAction({ game: g, lordId });
          break;
        }
        const before = coinsOf(g, player.id);
        game = engine.useDragon({
          game: g,
          lordId,
          buildingId: targets[pick(targets.length)]!.id,
        });
        expect(before - coinsOf(game, player.id)).toBe(price);
        coverage.dragons++;
        break;
      }
      default:
        game = engine.skipOptionalAction({ game: g, lordId });
    }
  }

  expect(isGameWithNextAction(game)).toBe(false);
  return coverage;
};

describe("Queendomino prices (GitHub #39)", () => {
  describe.each(MODES)("%s", (mode) => {
    test("the advertised price is exactly the coins debited by the action", () => {
      const total: Coverage = {
        constructions: 0,
        queenHostConstructions: 0,
        freeConstructions: 0,
        dragons: 0,
      };
      for (const seed of SEEDS) {
        const coverage = playAndCheckPrices(mode, seed);
        for (const key of Object.keys(total) as (keyof Coverage)[]) {
          total[key] += coverage[key];
        }
      }
      // The seeds cover the Queen's host, the free spot and the Dragon
      expect(total.constructions).toBeGreaterThan(0);
      expect(total.queenHostConstructions).toBeGreaterThan(0);
      expect(total.freeConstructions).toBeGreaterThan(0);
      expect(total.dragons).toBeGreaterThan(0);
    });

    test("the Queen lowers the spot price by 1 coin, never below 0", () => {
      const game = start(mode, "prices-queen");
      const [alice, bobby] = game.players;
      const hosted: GameState = {
        ...game,
        queendomino: { ...game.queendomino!, queenHolderId: alice!.id },
      };
      const board = hosted.queendomino!.buildersBoard;
      expect(board.slotCosts).toEqual([5, 4, 3, 2, 1, 0]);

      const forAlice = engine.getBuildersBoardPrices({
        game: hosted,
        playerId: alice!.id,
      });
      const forBobby = engine.getBuildersBoardPrices({
        game: hosted,
        playerId: bobby!.id,
      });
      expect(forBobby.map((p) => p.price)).toEqual([5, 4, 3, 2, 1, 0]);
      expect(forAlice.map((p) => p.price)).toEqual([4, 3, 2, 1, 0, 0]);
      expect(forAlice.map((p) => p.slotIndex)).toEqual([0, 1, 2, 3, 4, 5]);
    });

    test("a board without slotCosts uses the tile's own cost", () => {
      const game = start(mode, "prices-legacy");
      const [alice] = game.players;
      const { slotCosts: _, ...legacyBoard } = game.queendomino!.buildersBoard;
      const legacy: GameState = {
        ...game,
        queendomino: { ...game.queendomino!, buildersBoard: legacyBoard },
      };
      const tile = legacyBoard.slots[0]!;
      expect(
        engine.getBuildingPrice({
          game: legacy,
          playerId: alice!.id,
          buildingId: tile.id,
        }),
      ).toBe(tile.cost);
    });

    test("a building not on the board has no price", () => {
      const game = start(mode, "prices-missing");
      const playerId = game.players[0]!.id;
      expect(
        engine.getBuildingPrice({ game, playerId, buildingId: -1 }),
      ).toBeNull();
      const drawn = game.queendomino!.buildersBoard.drawPile[0]!;
      expect(
        engine.getBuildingPrice({ game, playerId, buildingId: drawn.id }),
      ).toBeNull();
    });

    test("the Dragon costs 1 coin", () => {
      const game = start(mode, "prices-dragon");
      for (const player of game.players) {
        expect(engine.getDragonPrice({ game, playerId: player.id })).toBe(1);
      }
    });
  });

  test("outside Queendomino there is no building to price", () => {
    const game = start("Classic", "prices-classic");
    const playerId = game.players[0]!.id;
    expect(engine.getBuildingPrice({ game, playerId, buildingId: 1 })).toBe(
      null,
    );
    expect(engine.getBuildersBoardPrices({ game, playerId })).toEqual([]);
  });

  test.each([
    "getBuildingPrice",
    "getDragonPrice",
    "getBuildersBoardPrices",
  ] as const)("%s throws PLAYER_NOT_FOUND for an unknown player", (method) => {
    const game = start("QueenDomino", "prices-unknown");
    const act = () =>
      engine[method]({ game, playerId: "nobody", buildingId: 1 });
    expect(act).toThrowError(NotFoundError);
    try {
      act();
    } catch (error) {
      expect((error as NotFoundError).code).toBe(ErrorCode.PLAYER_NOT_FOUND);
    }
  });

  test("the events, action log and debug wrappers pass them through", () => {
    const game = start("QueenDomino", "prices-wrappers");
    const playerId = game.players[0]!.id;
    const building = game.queendomino!.buildersBoard.slots[0]!;
    const expected = engine.getBuildersBoardPrices({ game, playerId });
    const { engine: logged } = wrapWithActionLog(engine);
    const wrapped = [
      wrapWithEvents(engine, {}),
      logged,
      wrapWithDebug(engine, { logger: { log: () => {} } }),
    ];
    for (const w of wrapped) {
      expect(
        w.getBuildingPrice({ game, playerId, buildingId: building.id }),
      ).toBe(5);
      expect(w.getDragonPrice({ game, playerId })).toBe(1);
      expect(w.getBuildersBoardPrices({ game, playerId })).toEqual(expected);
    }
  });
});
