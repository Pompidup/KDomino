import { isGameOver } from "@core/domain/entities/scoreBreakdown.js";
import type { GameState } from "@core/domain/types/game.js";
import {
  type PlayerScore,
  type ScoreBonusType,
  scoreBonusTypes,
} from "@core/domain/types/score.js";
import {
  localeTranslations,
  supportedLocales,
} from "@core/i18n/translations.js";
import type { GameEngine } from "@core/portUserside/engine.js";
import { describe, expect, test } from "vitest";
import { createGameEngine } from "../../index.js";
import { playSeededGame, scenarioName, scenarios } from "./seededGameDriver.js";

const END_GAME_ONLY: ScoreBonusType[] = ["harmony", "homoHabilis"];

const sumPoints = (values: { points: number }[]) =>
  values.reduce((total, value) => total + value.points, 0);

const expectConsistent = (score: PlayerScore) => {
  const { breakdown } = score;
  expect(breakdown.territoryPoints).toBe(sumPoints(breakdown.territories));
  expect(breakdown.bonusPoints).toBe(sumPoints(breakdown.bonuses));
  expect(breakdown.total).toBe(
    breakdown.territoryPoints + breakdown.bonusPoints,
  );
  expect(score.points).toBe(breakdown.total);
  for (const territory of breakdown.territories) {
    expect(territory.points).toBe(territory.cells.length * territory.crowns);
  }
};

const checkLiveScores = (engine: GameEngine, game: GameState) => {
  if (isGameOver(game)) return;
  for (const player of game.players) {
    const score = engine.calculatePlayerScore({ game, playerId: player.id });
    expectConsistent(score);
    expect(score.final).toBe(false);
    for (const bonus of score.breakdown.bonuses) {
      expect(bonus.provisional).toBe(true);
      expect(END_GAME_ONLY).not.toContain(bonus.type);
      expect(bonus.questType).not.toBe("harmony");
    }

    // Live score reflects the current Queen
    const hasQueen = score.breakdown.bonuses.some((b) => b.type === "queen");
    expect(hasQueen).toBe(game.queendomino?.queenHolderId === player.id);

    // Live score reflects the totems currently held
    if (game.origins?.totems) {
      const held = score.breakdown.bonuses
        .filter((b) => b.type === "totem")
        .map((b) => b.resource)
        .sort();
      const current = Object.entries(game.origins.totems)
        .filter(([, holder]) => holder === player.id)
        .map(([resource]) => resource)
        .sort();
      expect(held).toEqual(current);
    }

    // Without giants, the territory score matches calculateScore
    if (!player.giants?.length) {
      expect(engine.calculateScore({ kingdom: player.kingdom }).points).toBe(
        score.breakdown.territoryPoints,
      );
    }
  }
};

describe("calculatePlayerScore", () => {
  const seenBonusTypes = new Set<ScoreBonusType>();

  for (const scenario of scenarios) {
    test(`${scenarioName(scenario)}: live scores and final scores`, () => {
      const { engine, game } = playSeededGame(
        scenario,
        "alpha",
        checkLiveScores,
      );
      const results = engine.getResults({ game });

      for (const result of results.result) {
        const final = engine.calculatePlayerScore({
          game,
          playerId: result.playerId,
        });
        expectConsistent(final);
        expect(final.final).toBe(true);

        // getResults and calculatePlayerScore share the same computation
        expect(result.breakdown).toEqual(final.breakdown);
        expect(result.details).toEqual({
          points: final.points,
          maxPropertiesSize: final.maxPropertiesSize,
          totalCrowns: final.totalCrowns,
        });
        expect(result.details.points).toBe(result.breakdown?.total);

        // The state returned by getResults can be scored as well
        expect(
          engine.calculatePlayerScore({
            game: results,
            playerId: result.playerId,
          }),
        ).toEqual(final);

        for (const bonus of final.breakdown.bonuses) {
          seenBonusTypes.add(bonus.type);
          expect(bonus.provisional).toBe(false);
          for (const locale of supportedLocales) {
            expect(localeTranslations[locale][bonus.label]).toBeTypeOf(
              "string",
            );
          }
        }
      }
    });
  }

  test("every bonus type is exercised by the scenarios", () => {
    expect([...seenBonusTypes].sort()).toEqual(
      Object.values(scoreBonusTypes).sort(),
    );
  });

  test("throws when the player is not in the game", () => {
    const engine = createGameEngine({});
    let game: GameState = engine.createGame({ mode: "Classic" });
    game = engine.addPlayers({ game, players: ["Alice", "Bob"] });
    expect(() =>
      engine.calculatePlayerScore({ game, playerId: "unknown" }),
    ).toThrowError("Player not found");
  });

  test("scores a game that has not started", () => {
    const engine = createGameEngine({});
    let game: GameState = engine.createGame({ mode: "QueenDomino" });
    game = engine.addPlayers({ game, players: ["Alice", "Bob"] });
    const score = engine.calculatePlayerScore({
      game,
      playerId: game.players[0]!.id,
    });
    expect(score).toMatchObject({
      points: 0,
      final: false,
      breakdown: { territories: [], bonuses: [], total: 0 },
    });
  });
});
