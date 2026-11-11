/**
 * Characterization test for end-of-game scoring.
 *
 * Plays complete, fully deterministic games (seeded shuffles, deterministic
 * ids, deterministic bot decisions) in every mode and freezes the final
 * results returned by `getResults` in a snapshot. The driver also performs the
 * optional extension actions (buildings, knights, fire tokens, cavemen,
 * giants) so that every end-game bonus is exercised.
 *
 * The snapshot was recorded BEFORE the score breakdown refactor (issue #13):
 * final scores, positions and tie-breaks must never change.
 *
 * Deliberate rule changes regenerate only the scenarios of the modes they
 * touch: the Queendomino rules aligned on the official rulebook (issue #26)
 * regenerated the QueenDomino and AgeOfGiants-QueenDomino scenarios only; the
 * crowns tie-break of Kingdomino (issue #31) reordered the two players tied
 * on points and largest territory of "Classic 4p / seed bravo" only.
 */
import { describe, expect, test } from "vitest";
import {
  playSeededGame,
  SEEDS,
  scenarioName,
  scenarios,
} from "./seededGameDriver.js";

describe("Score characterization (final results must never change)", () => {
  for (const scenario of scenarios) {
    for (const seed of SEEDS) {
      test(`${scenarioName(scenario)} / seed ${seed}`, () => {
        const { engine, game } = playSeededGame(scenario, seed);
        const results = engine.getResults({ game });

        const extensions = game.players.map((p) => ({
          name: p.name,
          buildings: p.buildings?.length ?? 0,
          towers: p.towers ?? 0,
          knights: p.knights?.length ?? 0,
          fireTokens: p.fireTokens?.length ?? 0,
          resources: p.resources?.length ?? 0,
          cavemen: p.cavemen?.length ?? 0,
          giants: p.giants?.length ?? 0,
        }));

        expect({
          results: results.result.map((r) => ({
            name: r.playerName,
            position: r.position,
            points: r.details.points,
            maxPropertiesSize: r.details.maxPropertiesSize,
            totalCrowns: r.details.totalCrowns,
          })),
          queenHolder:
            game.players.find((p) => p.id === game.queendomino?.queenHolderId)
              ?.name ?? null,
          extensions,
        }).toMatchSnapshot();
      });
    }
  }
});
