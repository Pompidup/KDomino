import { isValidCavemanPosition } from "@core/domain/entities/caveman.js";
import { getValidFireTokenPositions } from "@core/domain/entities/fireToken.js";
import { countResourcesByType } from "@core/domain/entities/resource.js";
import type { GameState, GameWithNextAction } from "@core/domain/types/game.js";
import {
  isGameWithNextAction,
  isGameWithNextStep,
} from "@core/domain/types/game.js";
import type { Position } from "@core/domain/types/kingdom.js";
import type { ResourceType } from "@core/domain/types/origins.js";
import { playerActions } from "@core/domain/types/player.js";
import { describe, expect, test } from "vitest";
import { createGameEngine } from "../../index.js";

type OriginsModeName =
  | "KingdominoOrigins-Discovery"
  | "KingdominoOrigins-Totem"
  | "KingdominoOrigins-Tribe";

type SimulationOptions = {
  /** Place fire tokens instead of skipping them */
  placeFireTokens: boolean;
  /** Recruit cavemen whenever possible (Tribe mode) */
  recruit: boolean;
};

type SimulationStats = {
  game: GameState;
  /** Dominoes placed or discarded, per player id */
  dominoesHandled: Record<string, number>;
  /** Dominoes placed or discarded during the last turn, per lord id */
  lastTurnHandledByLord: Record<string, number>;
  fireTokensPlacedOnLastTurn: number;
  recruits: number;
  /** Recruitments made by the lord whose pick completed a round */
  recruitsAfterRoundEnd: number;
  /** Totem holders observed during the game (Totem mode) */
  totemChanges: number;
};

const RESOURCE_TYPES: ResourceType[] = ["mammoth", "fish", "mushroom", "flint"];

const engine = createGameEngine({});

const lordOwner = (game: GameWithNextAction, lordId: string) => {
  const lord = game.lords.find((l) => l.id === lordId);
  const player = game.players.find((p) => p.id === lord?.playerId);
  if (!lord || !player) throw new Error(`Unknown lord ${lordId}`);
  return { lord, player };
};

/**
 * Tries to recruit a visible caveman paying 2 resources of different types.
 * Returns the new game, or undefined if the player cannot recruit.
 */
const tryRecruit = (
  game: GameWithNextAction,
  lordId: string,
): GameState | undefined => {
  const { player } = lordOwner(game, lordId);
  const resources = player.resources ?? [];
  const first = resources[0];
  const second = resources.find((r) => r.type !== first?.type);
  const caveman = game.origins?.caveBoard?.visible[0];
  if (!first || !second || !caveman) return undefined;

  for (let y = 0; y < player.kingdom.length; y++) {
    for (let x = 0; x < player.kingdom[y]!.length; x++) {
      const position = { x, y };
      if (
        isValidCavemanPosition(
          player.kingdom,
          position,
          player.fireTokens ?? [],
          resources,
          player.cavemen ?? [],
        )
      ) {
        return engine.recruitCaveman({
          game,
          lordId,
          cavemanId: caveman.id,
          position,
          resourcePositions: [first.position, second.position],
        });
      }
    }
  }
  return undefined;
};

const simulate = (
  mode: OriginsModeName,
  playerNames: string[],
  seed: string,
  options: SimulationOptions,
): SimulationStats => {
  let game: GameState = engine.createGame({ mode, seed });
  game = engine.addPlayers({ game, players: playerNames });
  game = engine.startGame({ game });

  const stats: SimulationStats = {
    game,
    dominoesHandled: Object.fromEntries(game.players.map((p) => [p.id, 0])),
    lastTurnHandledByLord: {},
    fireTokensPlacedOnLastTurn: 0,
    recruits: 0,
    recruitsAfterRoundEnd: 0,
    totemChanges: 0,
  };

  let iterations = 0;
  while (isGameWithNextAction(game) && iterations < 2000) {
    iterations++;
    const action = game.nextAction.nextAction;
    const lordId = game.nextAction.nextLord;
    const isLastTurn = game.turn === game.rules.basic.maxTurns;
    const totemsBefore = JSON.stringify(game.origins?.totems);

    if (action === playerActions.pickDomino) {
      const unpicked = game.currentDominoes.find((d) => !d.picked);
      if (!unpicked) throw new Error("No domino left to pick");
      game = engine.chooseDomino({
        game,
        lordId,
        dominoPick: unpicked.domino.number,
      });
    } else if (
      action === playerActions.placeDomino ||
      action === playerActions.pass
    ) {
      const { lord, player } = lordOwner(game, lordId);
      const placements = lord.dominoPicked
        ? engine.getValidPlacements({
            kingdom: player.kingdom,
            domino: lord.dominoPicked,
          })
        : [];
      if (action === playerActions.placeDomino && placements.length > 0) {
        game = engine.placeDomino({
          game,
          lordId,
          position: placements[0]!.position,
          rotation: placements[0]!.rotation,
        });
      } else {
        game = engine.discardDomino({ game, lordId });
      }
      stats.dominoesHandled[player.id]!++;
      if (isLastTurn) {
        stats.lastTurnHandledByLord[lordId] =
          (stats.lastTurnHandledByLord[lordId] ?? 0) + 1;
      }
    } else if (action === playerActions.placeFireToken) {
      const { player } = lordOwner(game, lordId);
      const pending = game.origins?.pendingFireToken;
      const positions: Position[] =
        options.placeFireTokens && pending
          ? getValidFireTokenPositions(
              player.kingdom,
              pending.volcanoPosition,
              pending.fires,
              player.fireTokens ?? [],
            )
          : [];
      if (positions.length > 0) {
        game = engine.placeFireToken({
          game,
          lordId,
          position: positions[0]!,
        });
        if (isLastTurn) stats.fireTokensPlacedOnLastTurn++;
      } else {
        game = engine.skipOptionalAction({ game, lordId });
      }
    } else if (action === playerActions.recruitCaveman) {
      const roundJustEnded = game.lords.every(
        (l) => !l.hasPick && !l.turnEnded,
      );
      const recruited = options.recruit ? tryRecruit(game, lordId) : undefined;
      if (recruited) {
        game = recruited;
        stats.recruits++;
        if (roundJustEnded) stats.recruitsAfterRoundEnd++;
      } else {
        game = engine.skipOptionalAction({ game, lordId });
      }
    } else {
      throw new Error(`Unexpected action ${action}`);
    }

    if (JSON.stringify(game.origins?.totems) !== totemsBefore) {
      stats.totemChanges++;
    }
  }

  stats.game = game;
  return stats;
};

const expectEveryLordPlayedEveryDomino = (stats: SimulationStats) => {
  const { game } = stats;
  expect(isGameWithNextStep(game)).toBe(true);
  if (!isGameWithNextStep(game)) return;
  expect(game.nextAction.step).toBe("result");
  expect(game.turn).toBe(game.rules.basic.maxTurns);

  // Every lord has finished the last turn before the result step
  expect(game.lords.every((lord) => lord.turnEnded)).toBe(true);

  // Every lord placed (or discarded) exactly one domino in the last turn
  for (const lord of game.lords) {
    expect(stats.lastTurnHandledByLord[lord.id]).toBe(1);
  }

  // Every player handled one domino per lord and per turn
  const { maxTurns } = game.rules.basic;
  for (const player of game.players) {
    const lords = game.lords.filter((l) => l.playerId === player.id).length;
    expect(stats.dominoesHandled[player.id]).toBe(lords * maxTurns);
  }
  const total = Object.values(stats.dominoesHandled).reduce((a, b) => a + b, 0);
  expect(total).toBe(game.lords.length * maxTurns);
};

const MODES: OriginsModeName[] = [
  "KingdominoOrigins-Discovery",
  "KingdominoOrigins-Totem",
  "KingdominoOrigins-Tribe",
];

const PLAYER_SETS = [
  ["Grok", "Thag"],
  ["Grok", "Thag", "Ayla"],
  ["Grok", "Thag", "Ayla", "Rok"],
];

const SEEDS = ["origins-flow-1", "origins-flow-2", "origins-flow-3"];

describe("Origins game flow: every lord plays its last domino (#6)", () => {
  for (const mode of MODES) {
    for (const players of PLAYER_SETS) {
      test(`${mode} with ${players.length} players, skipping fire tokens`, () => {
        for (const seed of SEEDS) {
          const stats = simulate(mode, players, seed, {
            placeFireTokens: false,
            recruit: false,
          });
          expectEveryLordPlayedEveryDomino(stats);
        }
      });

      test(`${mode} with ${players.length} players, placing fire tokens`, () => {
        for (const seed of SEEDS) {
          const stats = simulate(mode, players, seed, {
            placeFireTokens: true,
            recruit: mode === "KingdominoOrigins-Tribe",
          });
          expectEveryLordPlayedEveryDomino(stats);
        }
      });
    }
  }

  test("a fire token placed during the last turn does not end the game early", () => {
    let placedOnLastTurn = 0;
    for (const mode of MODES) {
      for (const players of PLAYER_SETS) {
        for (let i = 0; i < 6; i++) {
          const stats = simulate(mode, players, `origins-last-fire-${i}`, {
            placeFireTokens: true,
            recruit: false,
          });
          expectEveryLordPlayedEveryDomino(stats);
          placedOnLastTurn += stats.fireTokensPlacedOnLastTurn;
        }
      }
    }
    // The scenario of the bug is actually exercised
    expect(placedOnLastTurn).toBeGreaterThan(0);
  });
});

describe("Origins Tribe: recruiting as the last lord of a round (#7)", () => {
  test("recruiting after the pick that ends a round does not skip the next turn", () => {
    let recruitsAfterRoundEnd = 0;
    for (const players of PLAYER_SETS) {
      for (const seed of [...SEEDS, "tribe-recruit-4", "tribe-recruit-5"]) {
        const stats = simulate("KingdominoOrigins-Tribe", players, seed, {
          placeFireTokens: true,
          recruit: true,
        });
        expectEveryLordPlayedEveryDomino(stats);
        recruitsAfterRoundEnd += stats.recruitsAfterRoundEnd;
      }
    }
    expect(recruitsAfterRoundEnd).toBeGreaterThan(0);
  });

  test("the recruiting lord keeps its placement and pick of the next turn", () => {
    let game: GameState = engine.createGame({
      mode: "KingdominoOrigins-Tribe",
      seed: "tribe-last-recruit",
    });
    game = engine.addPlayers({ game, players: ["Grok", "Thag"] });
    game = engine.startGame({ game });

    // Every lord picks a domino; the last pick ends the first round
    while (
      isGameWithNextAction(game) &&
      game.nextAction.nextAction !== playerActions.recruitCaveman
    ) {
      const unpicked = game.currentDominoes.find((d) => !d.picked)!;
      game = engine.chooseDomino({
        game,
        lordId: game.nextAction.nextLord,
        dominoPick: unpicked.domino.number,
      });
      if (
        isGameWithNextAction(game) &&
        game.nextAction.nextAction === playerActions.recruitCaveman &&
        game.lords.some((l) => l.turnEnded)
      ) {
        game = engine.skipOptionalAction({
          game,
          lordId: game.nextAction.nextLord,
        });
      }
    }

    if (!isGameWithNextAction(game)) throw new Error("Unexpected step");
    expect(game.turn).toBe(1);
    expect(game.lords.every((l) => !l.turnEnded && !l.hasPlace)).toBe(true);

    // Give the last picker enough resources to recruit, on a tile it owns
    const recruiterLordId = game.nextAction.nextLord;
    const { player } = lordOwner(game, recruiterLordId);
    const kingdom = player.kingdom.map((row) => [...row]);
    kingdom[0]![0] = { type: "grassland", crowns: 0 };
    kingdom[0]![1] = { type: "lake", crowns: 0 };
    kingdom[0]![2] = { type: "jungle", crowns: 0 };
    game = {
      ...game,
      players: game.players.map((p) =>
        p.id === player.id
          ? {
              ...p,
              kingdom,
              resources: [
                { type: "mammoth", position: { x: 0, y: 0 } },
                { type: "fish", position: { x: 1, y: 0 } },
              ],
            }
          : p,
      ),
    };

    const cavemanId = game.origins!.caveBoard!.visible[0]!.id;
    game = engine.recruitCaveman({
      game,
      lordId: recruiterLordId,
      cavemanId,
      position: { x: 2, y: 0 },
      resourcePositions: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
    });

    if (!isGameWithNextAction(game)) throw new Error("Unexpected step");
    const recruiter = game.lords.find((l) => l.id === recruiterLordId)!;
    expect(recruiter.turnEnded).toBe(false);
    expect(game.lords.every((l) => !l.turnEnded)).toBe(true);
    expect(game.nextAction.nextAction).toBe(playerActions.placeDomino);
    expect(game.nextAction.nextLord).toBe(game.lords[0]!.id);
    expect(game.players.find((p) => p.id === player.id)?.cavemen).toHaveLength(
      1,
    );
  });
});

describe("Origins Totem: totem holders and bonuses (#8)", () => {
  const strictLeader = (game: GameState, type: ResourceType): string | null => {
    const counts = game.players.map(
      (p) => countResourcesByType(p.resources ?? [])[type],
    );
    const max = Math.max(...counts);
    if (max === 0) return null;
    const leaders = game.players.filter((_, i) => counts[i] === max);
    return leaders.length === 1 ? leaders[0]!.id : null;
  };

  test("totems follow the resource majority and earn their bonus", () => {
    let totemsAwarded = 0;
    for (const players of PLAYER_SETS) {
      for (const seed of SEEDS) {
        const stats = simulate("KingdominoOrigins-Totem", players, seed, {
          placeFireTokens: true,
          recruit: false,
        });
        expectEveryLordPlayedEveryDomino(stats);
        const { game } = stats;
        if (!isGameWithNextStep(game)) throw new Error("Game not finished");

        // Totems are updated during the game
        expect(stats.totemChanges).toBeGreaterThan(0);

        const totems = game.origins!.totems!;
        for (const type of RESOURCE_TYPES) {
          const holder = totems[type];
          const leader = strictLeader(game, type);
          if (leader) {
            expect(holder).toBe(leader);
          }
          if (holder) {
            const holderCount = countResourcesByType(
              game.players.find((p) => p.id === holder)!.resources ?? [],
            )[type];
            for (const p of game.players) {
              expect(holderCount).toBeGreaterThanOrEqual(
                countResourcesByType(p.resources ?? [])[type],
              );
            }
            totemsAwarded++;
          }
        }

        // Totem bonus: compare with the same game scored without Totem rules
        const totemResults = engine.getResults({ game });
        const discoveryResults = engine.getResults({
          game: {
            ...game,
            mode: { ...game.mode, name: "KingdominoOrigins-Discovery" },
          },
        });
        for (const player of game.players) {
          const withTotem = totemResults.result.find(
            (r) => r.playerId === player.id,
          )!.details.points;
          const without = discoveryResults.result.find(
            (r) => r.playerId === player.id,
          )!.details.points;
          const heldTotems = RESOURCE_TYPES.filter(
            (type) => totems[type] === player.id,
          ).length;
          expect(withTotem - without).toBe(
            (player.resources ?? []).length + heldTotems * 3,
          );
        }
      }
    }
    expect(totemsAwarded).toBeGreaterThan(0);
  });
});
