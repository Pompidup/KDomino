/**
 * Live Harmony (GitHub #33): during the game `calculatePlayerScore` returns
 * the complete-kingdom bonus (Harmony, Homo Habilis, Age of Giants Harmony
 * quest) as provisional, with its points while it is still reachable, and 0
 * once the player had to discard a domino. The discards are kept in the game
 * state (`player.discardedDominoes`), serialized with it. The final score is
 * unchanged.
 */
import type { QuestTile } from "@core/domain/types/ageOfGiants.js";
import {
  type GameState,
  type GameWithNextAction,
  isGameWithNextAction,
} from "@core/domain/types/game.js";
import { GRIDSIZE, type Kingdom } from "@core/domain/types/kingdom.js";
import { type Player, playerActions } from "@core/domain/types/player.js";
import type { ScoreBonus } from "@core/domain/types/score.js";
import { describe, expect, test } from "vitest";
import { createGameEngine, greedyStrategy, playBotTurn } from "../../index.js";

const engine = createGameEngine({});

const HARMONY_QUEST: QuestTile = {
  id: 99,
  type: "harmony",
  name: "Harmony",
  description: "Complete kingdom",
  points: 5,
};

type Case = { mode: string; extraRules: string[] };

const CASES: Case[] = [
  { mode: "Classic", extraRules: ["Harmony"] },
  { mode: "QueenDomino", extraRules: ["Harmony"] },
  { mode: "KingdominoOrigins-Discovery", extraRules: ["Homo Habilis"] },
  // The Harmony quest is forced onto the quest tiles of the game
  { mode: "AgeOfGiants", extraRules: [] },
];

const isHarmonyBonus = (bonus: ScoreBonus): boolean =>
  bonus.type === "harmony" ||
  bonus.type === "homoHabilis" ||
  bonus.questType === "harmony";

const harmonyOf = (game: GameState, playerId: string): ScoreBonus => {
  const bonus = engine
    .calculatePlayerScore({ game, playerId })
    .breakdown.bonuses.find(isHarmonyBonus);
  if (!bonus) throw new Error("no complete-kingdom bonus");
  return bonus;
};

const start = ({ mode, extraRules }: Case): GameState => {
  let game: GameState = engine.createGame({ mode, seed: `live-harmony` });
  game = engine.addPlayers({ game, players: ["Alice", "Bobby"] });
  if (extraRules.length > 0) game = engine.addExtraRules({ game, extraRules });
  const started = engine.startGame({ game });
  return started.ageOfGiants
    ? {
        ...started,
        ageOfGiants: { ...started.ageOfGiants, questTiles: [HARMONY_QUEST] },
      }
    : started;
};

const currentPlayer = (game: GameWithNextAction): Player => {
  const lord = game.lords.find((l) => l.id === game.nextAction.nextLord)!;
  return game.players.find((p) => p.id === lord.playerId)!;
};

/** First domino, first placement (discard without one), optional actions skipped. */
const step = (g: GameWithNextAction): GameState => {
  const lordId = g.nextAction.nextLord;
  switch (g.nextAction.nextAction) {
    case playerActions.pickDomino:
      return engine.chooseDomino({
        game: g,
        lordId,
        dominoPick: engine.getValidDominoPicks({ game: g })[0]!,
      });
    case playerActions.placeDomino:
    case playerActions.pass: {
      const lord = g.lords.find((l) => l.id === lordId)!;
      const [placement] = lord.dominoPicked
        ? engine.getValidPlacements({
            kingdom: currentPlayer(g).kingdom,
            domino: lord.dominoPicked,
            maxKingdomSize: g.rules.basic.maxKingdomSize,
          })
        : [];
      return g.nextAction.nextAction === playerActions.placeDomino && placement
        ? engine.placeDomino({ game: g, lordId, ...placement })
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

/** Plays until a lord holding a domino must place it, after the first turn. */
const advanceToPlacement = (game: GameState): GameWithNextAction => {
  let current = game;
  for (let i = 0; i < 1000 && isGameWithNextAction(current); i++) {
    const lord = current.lords.find(
      (l) => l.id === current.nextAction.nextLord,
    );
    if (
      current.nextAction.nextAction === playerActions.placeDomino &&
      lord?.dominoPicked &&
      current.turn > 1
    ) {
      return current;
    }
    current = step(current);
  }
  throw new Error("no placement reached");
};

/**
 * A full kingdom frame of the kingdom size around the centred castle, except
 * two isolated corner squares: no domino can be placed anymore.
 */
const blockedKingdom = (size: number): Kingdom => {
  const center = Math.floor(GRIDSIZE / 2);
  const min = center - Math.floor(size / 2);
  const max = min + size - 1;
  return Array.from({ length: GRIDSIZE }, (_, y) =>
    Array.from({ length: GRIDSIZE }, (_, x) => {
      if (x === center && y === center) {
        return { type: "castle" as const, crowns: 0 };
      }
      const inFrame = x >= min && x <= max && y >= min && y <= max;
      const hole = (x === min && y === min) || (x === max && y === max);
      return inFrame && !hole
        ? { type: "wheat" as const, crowns: 0 }
        : { type: "empty" as const, crowns: 0 };
    }),
  );
};

const playToEnd = (game: GameState): GameState => {
  let current = game;
  for (let i = 0; i < 5000 && isGameWithNextAction(current); i++) {
    current = step(current);
  }
  expect(isGameWithNextAction(current)).toBe(false);
  return current;
};

describe("Live Harmony in calculatePlayerScore", () => {
  describe.each(CASES)("$mode $extraRules", (testCase) => {
    test("provisional while reachable, 0 after a forced discard, final unchanged", () => {
      const g = advanceToPlacement(start(testCase));

      // Nobody discarded yet: the bonus is announced to every player
      for (const player of g.players) {
        expect(player.discardedDominoes ?? 0).toBe(0);
        expect(harmonyOf(g, player.id)).toMatchObject({
          points: 5,
          provisional: true,
        });
      }

      // The current player can no longer place anything: forced discard
      const loser = currentPlayer(g);
      const blocked: GameWithNextAction = {
        ...g,
        players: g.players.map((p) =>
          p.id === loser.id
            ? { ...p, kingdom: blockedKingdom(g.rules.basic.maxKingdomSize) }
            : p,
        ),
      };
      const lordId = blocked.nextAction.nextLord;
      expect(
        engine.canPlaceDomino({
          kingdom: currentPlayer(blocked).kingdom,
          domino: blocked.lords.find((l) => l.id === lordId)!.dominoPicked!,
          maxKingdomSize: blocked.rules.basic.maxKingdomSize,
        }),
      ).toBe(false);
      const afterDiscard = engine.discardDomino({ game: blocked, lordId });

      const discarded = afterDiscard.players.find((p) => p.id === loser.id)!;
      expect(discarded.discardedDominoes).toBe(1);
      expect(harmonyOf(afterDiscard, loser.id)).toMatchObject({
        points: 0,
        provisional: true,
      });
      for (const other of afterDiscard.players) {
        if (other.id === loser.id) continue;
        expect(other.discardedDominoes ?? 0).toBe(0);
        expect(harmonyOf(afterDiscard, other.id).points).toBe(5);
      }

      // The discards are part of the saved game
      const restored = engine.deserialize({
        json: engine.serialize({ game: afterDiscard }),
      });
      expect(
        restored.players.find((p) => p.id === loser.id)!.discardedDominoes,
      ).toBe(1);
      expect(harmonyOf(restored, loser.id).points).toBe(0);

      // End of the game: final bonus, unchanged rule (complete kingdom)
      const over = playToEnd(afterDiscard);
      const final = harmonyOf(over, loser.id);
      expect(final).toMatchObject({ points: 0, provisional: false });
      const { result } = engine.getResults({ game: over });
      const loserResult = result.find((r) => r.playerId === loser.id)!;
      expect(loserResult.breakdown?.bonuses.find(isHarmonyBonus)).toEqual(
        final,
      );
    });
  });

  test("a kingdom completed without discard announced Harmony at every step", () => {
    // Deterministic ids: the bot decisions only depend on the seed
    let counter = 0;
    const engine = createGameEngine({ uuidMethod: () => `id-${++counter}` });
    const harmonyOf = (game: GameState, playerId: string): ScoreBonus =>
      engine
        .calculatePlayerScore({ game, playerId })
        .breakdown.bonuses.find(isHarmonyBonus)!;
    let game: GameState = engine.createGame({
      mode: "Classic",
      seed: "s2",
    });
    game = engine.addPlayers({
      game,
      players: ["Alice", "Bobby"],
    });
    game = engine.addExtraRules({ game, extraRules: ["Harmony"] });
    game = engine.startGame({ game });

    const live = new Map<string, number[]>();
    for (let i = 0; i < 1000 && isGameWithNextAction(game); i++) {
      game = playBotTurn(engine, game, greedyStrategy);
      if (!isGameWithNextAction(game)) break;
      for (const player of game.players) {
        const bonus = harmonyOf(game, player.id);
        expect(bonus.provisional).toBe(true);
        live.set(player.id, [...(live.get(player.id) ?? []), bonus.points]);
      }
    }

    let completed = 0;
    for (const player of game.players) {
      const final = harmonyOf(game, player.id);
      expect(final.provisional).toBe(false);
      if (final.points === 5) {
        completed++;
        expect(live.get(player.id)!.every((points) => points === 5)).toBe(true);
        expect(player.discardedDominoes ?? 0).toBe(0);
      }
    }
    expect(completed).toBeGreaterThan(0);
  });
});
