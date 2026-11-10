import { countDominoes } from "@core/domain/entities/kingdom.js";
import {
  ErrorCode,
  StepExecutionError,
} from "@core/domain/errors/domainErrors.js";
import {
  type GameState,
  type GameWithNextAction,
  type GameWithNextStep,
  isGameWithNextAction,
} from "@core/domain/types/game.js";
import type { GameEngine } from "@core/portUserside/engine.js";
import { playBotTurn, randomStrategy } from "@core/useCases/bot.js";
import { describe, expect, test } from "vitest";
import { createGameEngine } from "../../index.js";

const engine: GameEngine = createGameEngine({});

const names = (count: number): string[] =>
  ["Alice", "Bobby", "Carol", "David", "Ellen"].slice(0, count);

const setup = (
  mode: string,
  playerCount: number,
  seed: string,
  extraRules: string[] = [],
): GameWithNextStep => {
  let game = engine.createGame({ mode, seed });
  game = engine.addPlayers({ game, players: names(playerCount) });
  return engine.addExtraRules({ game, extraRules });
};

/** Plays the whole game with random bots and counts placeGiant prompts. */
const playToEnd = (
  start: GameState,
): { game: GameState; placeGiantCount: number } => {
  let game = start;
  let placeGiantCount = 0;
  let guard = 0;
  while (isGameWithNextAction(game) && guard++ < 2000) {
    if (game.nextAction.nextAction === "placeGiant") {
      placeGiantCount++;
    }
    game = playBotTurn(engine, game as GameWithNextAction, randomStrategy);
  }
  return { game, placeGiantCount };
};

describe("Age of Giants: dominoes discarded from each line (#10)", () => {
  test.each([
    [2, [2]],
    [3, [1, 3]],
    [4, [2]],
    [5, []],
  ])("with %i players the first line drops positions %j of the sorted line", (playerCount, discarded) => {
    const game = setup("AgeOfGiants", playerCount, `aog-line-${playerCount}`);
    const sortedLine = game.dominoes
      .slice(0, 5)
      .map((d) => d.number)
      .sort((a, b) => a - b);
    const expected = sortedLine.filter((_, i) => !discarded.includes(i));

    const started = engine.startGame({ game });

    expect(started.currentDominoes.map((d) => d.domino.number)).toEqual(
      expected,
    );
  });

  test("the revealed line is deterministic for a given seed", () => {
    const first = engine.startGame({ game: setup("AgeOfGiants", 3, "same") });
    const second = engine.startGame({ game: setup("AgeOfGiants", 3, "same") });
    expect(first.currentDominoes).toEqual(second.currentDominoes);
  });

  test.each([
    2, 3, 4,
  ])("giant dominoes are revealed and placeGiant is played with %i players", (playerCount) => {
    let revealedGiants = 0;
    let placeGiantCount = 0;

    for (let i = 0; i < 12; i++) {
      let game: GameState = engine.startGame({
        game: setup("AgeOfGiants", playerCount, `giants-${playerCount}-${i}`),
      });
      // Count giant dominoes in every revealed line
      let guard = 0;
      let lastTurn = -1;
      while (isGameWithNextAction(game) && guard++ < 2000) {
        if (game.turn !== lastTurn) {
          lastTurn = game.turn;
          revealedGiants += game.currentDominoes.filter(
            (d) => d.domino.letter !== undefined,
          ).length;
        }
        if (game.nextAction.nextAction === "placeGiant") {
          placeGiantCount++;
        }
        game = playBotTurn(engine, game, randomStrategy);
      }
      expect(game.nextAction).toEqual({ type: "step", step: "result" });
    }

    expect(revealedGiants).toBeGreaterThan(0);
    expect(placeGiantCount).toBeGreaterThan(0);
  });
});

describe("3-player games keep 48 dominoes and 4 revealed per line (#11)", () => {
  test.each([
    "Classic",
    "QueenDomino",
    "KingdominoOrigins-Discovery",
  ])("%s: the leftover domino of each line is discarded", (mode) => {
    const game = setup(mode, 3, `three-${mode}`);
    expect(game.dominoes).toHaveLength(48);
    expect(game.rules.basic).toMatchObject({
      lords: 1,
      maxDominoes: 48,
      dominoesPerTurn: 4,
      maxTurns: 12,
    });

    let started: GameState = engine.startGame({ game });
    expect(started.currentDominoes).toHaveLength(4);
    expect(started.dominoes).toHaveLength(44);

    // Each of the 3 players picks one domino of the first line
    for (let i = 0; i < 3; i++) {
      const current = started as GameWithNextAction;
      const free = current.currentDominoes.find((d) => !d.picked)!;
      started = engine.chooseDomino({
        game: current,
        lordId: current.nextAction.nextLord,
        dominoPick: free.domino.number,
      });
    }

    // A new line of 4 is drawn; the unpicked 4th domino is gone
    expect(started.turn).toBe(1);
    expect(started.currentDominoes).toHaveLength(4);
    expect(started.dominoes).toHaveLength(40);

    const { game: ended } = playToEnd(started);
    expect(ended.nextAction).toEqual({ type: "step", step: "result" });
    for (const player of ended.players) {
      expect(countDominoes(player.kingdom)).toBeLessThanOrEqual(12);
    }
  });

  test("AgeOfGiants: 5 drawn, 3 presented per line", () => {
    const game = engine.startGame({ game: setup("AgeOfGiants", 3, "aog-3") });
    expect(game.rules.basic.dominoesPerTurn).toBe(5);
    expect(game.currentDominoes).toHaveLength(3);
  });
});

describe("Solo games (#11)", () => {
  test("48 dominoes, 4 revealed, 1 kept per line, 12 turns", () => {
    const game = setup("Classic", 1, "solo");
    expect(game.dominoes).toHaveLength(48);
    expect(game.rules.basic).toMatchObject({
      lords: 1,
      maxDominoes: 48,
      dominoesPerTurn: 4,
      maxTurns: 12,
    });

    const started = engine.startGame({ game });
    expect(started.currentDominoes).toHaveLength(4);

    const picked = engine.chooseDomino({
      game: started,
      lordId: started.nextAction.nextLord,
      dominoPick: started.currentDominoes[0]!.domino.number,
    });
    expect(picked.turn).toBe(1);
    expect(picked.currentDominoes).toHaveLength(4);
    expect(picked.dominoes).toHaveLength(40);

    const { game: ended } = playToEnd(picked);
    expect(ended.nextAction).toEqual({ type: "step", step: "result" });
    expect(ended.turn).toBe(12);
    expect(countDominoes(ended.players[0]!.kingdom)).toBeLessThanOrEqual(12);
  });
});

describe("Extra rules validation through the engine (#9)", () => {
  test("The Mighty Duel is refused with 4 players", () => {
    let game = engine.createGame({ mode: "Classic" });
    game = engine.addPlayers({ game, players: names(4) });

    let error: unknown;
    try {
      engine.addExtraRules({ game, extraRules: ["The Mighty Duel"] });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(StepExecutionError);
    expect((error as StepExecutionError).code).toBe(
      ErrorCode.EXTRA_RULE_NOT_AVAILABLE,
    );
  });

  test("getExtraRules does not list The Mighty Duel for 4 players", () => {
    const rules = engine.getExtraRules({ mode: "Classic", players: 4 });
    expect(rules.map((r) => r.name)).not.toContain("The Mighty Duel");
  });

  test("Neolithic plays a 2-player Origins game on a 7x7 territory", () => {
    const game = setup("KingdominoOrigins-Discovery", 2, "neolithic", [
      "Neolithic",
    ]);
    expect(game.dominoes).toHaveLength(48);
    expect(game.rules.basic.maxKingdomSize).toBe(7);

    const { game: ended } = playToEnd(engine.startGame({ game }));
    expect(ended.nextAction).toEqual({ type: "step", step: "result" });
    for (const player of ended.players) {
      expect(countDominoes(player.kingdom)).toBeLessThanOrEqual(24);
    }
  });
});
