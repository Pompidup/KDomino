import {
  type GameState,
  type GameWithNextAction,
  isGameWithNextAction,
} from "@core/domain/types/game.js";
import type { Kingdom, Position } from "@core/domain/types/kingdom.js";
import { playerActions } from "@core/domain/types/player.js";
import { describe, expect, test } from "vitest";
import { createGameEngine } from "../../index.js";

/*
 * Property tests of the valid-target queries, on seeded simulations:
 * - every target a query returns is accepted by the matching action;
 * - targets it leaves out are refused by the action (checked exhaustively on
 *   the kingdom grid, the Builders Board and the giants/players, and on
 *   samples for the resource payments of a recruitment);
 * - `canSkipOptionalAction` matches what `skipOptionalAction` does.
 * The simulations play the returned targets themselves, so later states
 * contain knights, buildings, fire tokens, cavemen and (sent) giants.
 */

const engine = createGameEngine({});

const key = (p: Position): string => `${p.x},${p.y}`;
const paymentKey = (positions: Position[]): string =>
  positions.map(key).sort().join("|");

const gridOf = (kingdom: Kingdom): Position[] => [
  ...kingdom.flatMap((row, y) => row.map((_, x) => ({ x, y }))),
  { x: -1, y: 0 },
  { x: 0, y: kingdom.length },
];

const succeeds = (action: () => unknown): boolean => {
  try {
    action();
    return true;
  } catch {
    return false;
  }
};

const createRandom = (seed: string): (() => number) => {
  let state = 0;
  for (let i = 0; i < seed.length; i++) {
    state = Math.imul(state ^ seed.charCodeAt(i), 2654435761);
  }
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const pick = <T>(random: () => number, items: T[]): T =>
  items[Math.floor(random() * items.length)]!;

const shuffle = <T>(random: () => number, items: T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
};

const currentPlayer = (game: GameWithNextAction) => {
  const lord = game.lords.find((l) => l.id === game.nextAction.nextLord)!;
  return game.players.find((p) => p.id === lord.playerId)!;
};

type Coverage = Record<string, number>;
const bump = (coverage: Coverage, name: string): void => {
  coverage[name] = (coverage[name] ?? 0) + 1;
};

const otherLordId = (game: GameWithNextAction): string | undefined =>
  game.lords.find((l) => l.id !== game.nextAction.nextLord)?.id;

/** Queries answer empty for another lord and when their action is not current. */
const checkScoping = (game: GameState): void => {
  const action = isGameWithNextAction(game)
    ? game.nextAction.nextAction
    : undefined;
  const lordIds = isGameWithNextAction(game)
    ? [undefined, otherLordId(game)]
    : [undefined];

  for (const lordId of lordIds) {
    const isOther = lordId !== undefined;
    const command = { game, ...(lordId !== undefined && { lordId }) };
    if (isOther || action !== playerActions.placeFireToken)
      expect(engine.getValidFireTokenPositions(command)).toEqual([]);
    if (isOther || action !== playerActions.placeKnight)
      expect(engine.getValidKnightPositions(command)).toEqual([]);
    if (isOther || action !== playerActions.constructBuilding) {
      expect(engine.getValidBuildingPositions(command)).toEqual([]);
      expect(engine.getAffordableBuildings(command)).toEqual([]);
    }
    if (isOther || action !== playerActions.recruitCaveman)
      expect(engine.getValidCavemanPlacements(command)).toEqual({
        options: [],
        positions: [],
      });
    if (isOther || action !== playerActions.placeGiant)
      expect(engine.getValidGiantPositions(command)).toEqual([]);
    if (isOther || action !== playerActions.sendGiant)
      expect(engine.getValidGiantTargets(command)).toEqual({
        giantIndexes: [],
        targetPlayerIds: [],
      });
    if (isOther || !isGameWithNextAction(game))
      expect(engine.canSkipOptionalAction(command)).toBe(false);
  }
};

/** Positions returned ⇔ the action succeeds, on every square of the grid. */
const checkPositions = (
  game: GameWithNextAction,
  valid: Position[],
  act: (position: Position) => unknown,
): void => {
  const validKeys = new Set(valid.map(key));
  expect(validKeys.size).toBe(valid.length);
  for (const position of gridOf(currentPlayer(game).kingdom)) {
    expect(
      succeeds(() => act(position)),
      `position ${key(position)}`,
    ).toBe(validKeys.has(key(position)));
  }
};

const checkSkip = (game: GameWithNextAction): void => {
  const lordId = game.nextAction.nextLord;
  expect(engine.canSkipOptionalAction({ game })).toBe(
    succeeds(() => engine.skipOptionalAction({ game, lordId })),
  );
  expect(engine.canSkipOptionalAction({ game, lordId })).toBe(
    engine.canSkipOptionalAction({ game }),
  );
  if (game.nextAction.nextAction === playerActions.placeGiant) {
    expect(engine.canSkipOptionalAction({ game })).toBe(false);
  }
};

const checkFireToken = (game: GameWithNextAction, coverage: Coverage) => {
  const lordId = game.nextAction.nextLord;
  const valid = engine.getValidFireTokenPositions({ game });
  expect(engine.getValidFireTokenPositions({ game, lordId })).toEqual(valid);
  checkPositions(game, valid, (position) =>
    engine.placeFireToken({ game, lordId, position }),
  );
  if (valid.length > 0) bump(coverage, "fireToken");
  return valid;
};

const checkKnight = (game: GameWithNextAction, coverage: Coverage) => {
  const lordId = game.nextAction.nextLord;
  const valid = engine.getValidKnightPositions({ game });
  expect(engine.getValidKnightPositions({ game, lordId })).toEqual(valid);
  checkPositions(game, valid, (position) =>
    engine.placeKnight({ game, lordId, position }),
  );
  if (valid.length > 0) bump(coverage, "knight");
  return valid;
};

const checkBuilding = (game: GameWithNextAction, coverage: Coverage) => {
  const lordId = game.nextAction.nextLord;
  const positions = engine.getValidBuildingPositions({ game });
  const buildings = engine.getAffordableBuildings({ game });
  expect(engine.getValidBuildingPositions({ game, lordId })).toEqual(positions);
  expect(engine.getAffordableBuildings({ game, lordId })).toEqual(buildings);
  expect(positions.length === 0).toBe(buildings.length === 0);

  const validPositions = new Set(positions.map(key));
  const validBuildings = new Set(buildings.map((b) => b.id));
  const boardIds = [
    ...(game.queendomino?.buildersBoard.slots ?? []).flatMap((slot) =>
      slot ? [slot.id] : [],
    ),
    ...(game.queendomino?.buildersBoard.drawPile.slice(0, 1) ?? []).map(
      (b) => b.id,
    ),
    9999,
  ];
  // Exhaustive: every board building on every square
  for (const buildingId of boardIds) {
    for (const position of gridOf(currentPlayer(game).kingdom)) {
      expect(
        succeeds(() =>
          engine.constructBuilding({ game, lordId, buildingId, position }),
        ),
        `building ${buildingId} at ${key(position)}`,
      ).toBe(
        validBuildings.has(buildingId) && validPositions.has(key(position)),
      );
    }
  }
  if (buildings.length > 0) bump(coverage, "building");
  return { positions, buildings };
};

const checkCaveman = (
  game: GameWithNextAction,
  random: () => number,
  coverage: Coverage,
) => {
  const lordId = game.nextAction.nextLord;
  const answer = engine.getValidCavemanPlacements({ game });
  expect(engine.getValidCavemanPlacements({ game, lordId })).toEqual(answer);
  const { options, positions } = answer;
  expect(options.length === 0).toBe(positions.length === 0);

  const recruit = (
    cavemanId: number,
    position: Position,
    resourcePositions: Position[],
  ) =>
    succeeds(() =>
      engine.recruitCaveman({
        game,
        lordId,
        cavemanId,
        position,
        resourcePositions,
      }),
    );

  const board = game.origins?.caveBoard;
  const boardCavemen = [...(board?.visible ?? []), ...(board?.drawPile ?? [])];
  const resources = currentPlayer(game).resources ?? [];

  // Every returned option, payment and position is accepted
  for (const option of options) {
    expect(option.resourceCombinations.length).toBeGreaterThan(0);
    for (const position of positions) {
      expect(
        recruit(option.cavemanId, position, option.resourceCombinations[0]!),
      ).toBe(true);
    }
    for (const payment of option.resourceCombinations.slice(0, 40)) {
      expect(recruit(option.cavemanId, positions[0]!, payment)).toBe(true);
    }
  }

  // Squares left out are refused, even with a valid caveman and payment
  const anyOption = options[0];
  const validPositions = new Set(positions.map(key));
  for (const position of gridOf(currentPlayer(game).kingdom)) {
    if (validPositions.has(key(position))) continue;
    if (anyOption) {
      expect(
        recruit(
          anyOption.cavemanId,
          position,
          anyOption.resourceCombinations[0]!,
        ),
        `caveman at ${key(position)}`,
      ).toBe(false);
    }
  }

  // Payments left out are refused (samples of 1 to 5 resources, plus a
  // square without resource), and so are cavemen left out
  const candidatePositions =
    positions.length > 0
      ? positions
      : gridOf(currentPlayer(game).kingdom).slice(0, 3);
  for (const caveman of [...boardCavemen, { id: 9999 }]) {
    const option = options.find((o) => o.cavemanId === caveman.id);
    const validPayments = new Set(
      (option?.resourceCombinations ?? []).map(paymentKey),
    );
    for (let sample = 0; sample < 6; sample++) {
      const size = 1 + Math.floor(random() * 5);
      const shuffled = shuffle(random, resources);
      const payment = shuffled.slice(0, size).map((r) => r.position);
      if (random() < 0.15) payment.push({ x: 0, y: 0 });
      const expected = validPayments.has(paymentKey(payment));
      expect(
        recruit(caveman.id, pick(random, candidatePositions), payment),
        `caveman ${caveman.id} paid with ${paymentKey(payment)}`,
      ).toBe(expected && validPositions.size > 0);
    }
  }

  // Visible cavemen: every pair of resources is checked
  const visibleOption = options.find((o) => o.source === "visible");
  if (visibleOption) {
    const validPayments = new Set(
      visibleOption.resourceCombinations.map(paymentKey),
    );
    for (let i = 0; i < resources.length; i++) {
      for (let j = i + 1; j < resources.length; j++) {
        const payment = [resources[i]!.position, resources[j]!.position];
        expect(recruit(visibleOption.cavemanId, positions[0]!, payment)).toBe(
          validPayments.has(paymentKey(payment)),
        );
      }
    }
  }

  if (options.length > 0) bump(coverage, "caveman");
  return answer;
};

const checkGiantPositions = (game: GameWithNextAction, coverage: Coverage) => {
  const lordId = game.nextAction.nextLord;
  const valid = engine.getValidGiantPositions({ game });
  expect(engine.getValidGiantPositions({ game, lordId })).toEqual(valid);
  checkPositions(game, valid, (position) =>
    engine.placeGiant({ game, lordId, position }),
  );
  // placeGiant is mandatory: the engine only asks for it with a free crown
  expect(valid.length).toBeGreaterThan(0);
  bump(coverage, "placeGiant");
  if (game.ageOfGiants?.pendingGiant) {
    expect(currentPlayer(game).id).toBe(
      game.ageOfGiants.pendingGiant.targetPlayerId,
    );
    bump(coverage, "pendingGiant");
  }
  return valid;
};

/** sendGiant succeeds exactly for the returned giant indexes and targets. */
const checkGiantTargetsOn = (game: GameWithNextAction) => {
  const lordId = game.nextAction.nextLord;
  const answer = engine.getValidGiantTargets({ game });
  expect(engine.getValidGiantTargets({ game, lordId })).toEqual(answer);
  const { giantIndexes, targetPlayerIds } = answer;
  expect(giantIndexes.length === 0).toBe(targetPlayerIds.length === 0);

  const giants = currentPlayer(game).giants ?? [];
  const indexes = [-1, ...giants.map((_, i) => i), giants.length];
  const playerIds = [...game.players.map((p) => p.id), "unknown-player"];
  for (const giantIndex of indexes) {
    for (const targetPlayerId of playerIds) {
      expect(
        succeeds(() =>
          engine.sendGiant({ game, lordId, giantIndex, targetPlayerId }),
        ),
        `giant ${giantIndex} to ${targetPlayerId}`,
      ).toBe(
        giantIndexes.includes(giantIndex) &&
          targetPlayerIds.includes(targetPlayerId),
      );
    }
  }
  return answer;
};

const checkGiantTargets = (game: GameWithNextAction, coverage: Coverage) => {
  const answer = checkGiantTargetsOn(game);
  if (answer.giantIndexes.length > 0) bump(coverage, "sendGiant");

  // Same state, but one opponent has all its crowns covered: it cannot be
  // targeted any more
  const sender = currentPlayer(game);
  const opponent = game.players.find((p) => p.id !== sender.id);
  if (opponent && answer.targetPlayerIds.includes(opponent.id)) {
    const covered: GameWithNextAction = {
      ...game,
      players: game.players.map((p) =>
        p.id === opponent.id
          ? {
              ...p,
              giants: p.kingdom.flatMap((row, y) =>
                row.flatMap((tile, x) =>
                  tile.crowns > 0 ? [{ position: { x, y } }] : [],
                ),
              ),
            }
          : p,
      ),
    };
    const coveredAnswer = checkGiantTargetsOn(covered);
    expect(coveredAnswer.targetPlayerIds).not.toContain(opponent.id);
    bump(coverage, "opponentFullyCovered");
  }
  return answer;
};

/**
 * Plays a seeded game, checking every state, and choosing the returned
 * targets (or skipping) so the extension pieces pile up.
 */
const simulate = (
  mode: string,
  seed: string,
  players: string[],
  coverage: Coverage,
): void => {
  const random = createRandom(`${mode}|${seed}`);
  let game: GameState = engine.createGame({ mode, seed });
  game = engine.addPlayers({ game, players });
  game = engine.startGame({ game });

  for (let steps = 0; steps < 2000 && isGameWithNextAction(game); steps++) {
    checkScoping(game);
    checkSkip(game);

    const g: GameWithNextAction = game;
    const lordId = g.nextAction.nextLord;
    const skip = () => engine.skipOptionalAction({ game: g, lordId });
    const play = random() < 0.8;

    switch (g.nextAction.nextAction) {
      case playerActions.pickDomino: {
        const available = g.currentDominoes.filter((d) => !d.picked);
        game = engine.chooseDomino({
          game: g,
          lordId,
          dominoPick: pick(random, available).domino.number,
        });
        break;
      }
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
        if (
          g.nextAction.nextAction === playerActions.placeDomino &&
          placements.length > 0
        ) {
          const { position, rotation } = pick(random, placements);
          game = engine.placeDomino({ game: g, lordId, position, rotation });
        } else {
          game = engine.discardDomino({ game: g, lordId });
        }
        break;
      }
      case playerActions.placeFireToken: {
        const valid = checkFireToken(g, coverage);
        game =
          play && valid.length > 0
            ? engine.placeFireToken({
                game: g,
                lordId,
                position: pick(random, valid),
              })
            : skip();
        break;
      }
      case playerActions.placeKnight: {
        const valid = checkKnight(g, coverage);
        game =
          play && valid.length > 0
            ? engine.placeKnight({
                game: g,
                lordId,
                position: pick(random, valid),
              })
            : skip();
        break;
      }
      case playerActions.constructBuilding: {
        const { positions, buildings } = checkBuilding(g, coverage);
        game =
          play && buildings.length > 0
            ? engine.constructBuilding({
                game: g,
                lordId,
                buildingId: pick(random, buildings).id,
                position: pick(random, positions),
              })
            : skip();
        break;
      }
      case playerActions.recruitCaveman: {
        const { options, positions } = checkCaveman(g, random, coverage);
        if (play && options.length > 0) {
          const option = pick(random, options);
          game = engine.recruitCaveman({
            game: g,
            lordId,
            cavemanId: option.cavemanId,
            position: pick(random, positions),
            resourcePositions: pick(random, option.resourceCombinations),
          });
        } else {
          game = skip();
        }
        break;
      }
      case playerActions.placeGiant: {
        const valid = checkGiantPositions(g, coverage);
        game = engine.placeGiant({
          game: g,
          lordId,
          position: pick(random, valid),
        });
        break;
      }
      case playerActions.sendGiant: {
        const { giantIndexes, targetPlayerIds } = checkGiantTargets(
          g,
          coverage,
        );
        game =
          giantIndexes.length > 0 && random() < 0.9
            ? engine.sendGiant({
                game: g,
                lordId,
                giantIndex: pick(random, giantIndexes),
                targetPlayerId: pick(random, targetPlayerIds),
              })
            : skip();
        break;
      }
      default:
        // useDragon (no target query)
        game = skip();
    }
  }

  expect(isGameWithNextAction(game)).toBe(false);
  checkScoping(game);
};

const SEEDS = ["alpha", "bravo", "charlie"];
const PLAYERS = [
  ["Alice", "Bobby"],
  ["Alice", "Bobby", "Carol"],
  ["Alice", "Bobby", "Carol", "David"],
];

describe("valid targets for extension actions (property tests)", () => {
  test.each([
    ["QueenDomino", ["knight", "building"]],
    ["KingdominoOrigins-Discovery", ["fireToken"]],
    ["KingdominoOrigins-Totem", ["fireToken"]],
    ["KingdominoOrigins-Tribe", ["fireToken", "caveman"]],
    [
      "AgeOfGiants",
      ["placeGiant", "sendGiant", "pendingGiant", "opponentFullyCovered"],
    ],
    [
      "AgeOfGiants-QueenDomino",
      ["placeGiant", "sendGiant", "knight", "building"],
    ],
  ])("%s: returned targets succeed, others fail", (mode, expected) => {
    const coverage: Coverage = {};
    SEEDS.forEach((seed, index) => {
      simulate(mode, seed, PLAYERS[index % PLAYERS.length]!, coverage);
    });
    for (const name of expected) {
      expect(coverage[name] ?? 0, `${name} states checked`).toBeGreaterThan(0);
    }
  });

  test("queries answer empty outside an action", () => {
    const game = engine.createGame({ mode: "QueenDomino", seed: "setup" });
    checkScoping(game);
    expect(engine.canSkipOptionalAction({ game })).toBe(false);
  });
});
