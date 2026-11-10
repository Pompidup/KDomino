import jsonRules from "@adapter/jsonRules.js";
import {
  createEmptyKingdom,
  placeCastle,
} from "@core/domain/entities/kingdom.js";
import type { QuestTile } from "@core/domain/types/ageOfGiants.js";
import type { NextStep } from "@core/domain/types/game.js";
import type { Kingdom } from "@core/domain/types/kingdom.js";
import type { BasicRules, ExtraRule } from "@core/domain/types/rule.js";
import { getResultUseCase } from "@core/useCases/getResult.js";
import { unwrap } from "@utils/result.js";
import { describe, expect, test } from "vitest";
import { createGameBuilder } from "../../builder/game.js";
import { createPlayerBuilder } from "../../builder/player.js";

const rules = jsonRules().getAll();

const harmony: ExtraRule = {
  name: "Harmony",
  description: "Complete kingdom",
  mode: [{ name: "Classic", description: "Classic" }],
};

const homoHabilis: ExtraRule = {
  name: "Homo Habilis",
  description: "Complete territory",
  mode: [
    {
      name: "KingdominoOrigins-Discovery",
      description: "Origins Discovery",
    },
  ],
};

const harmonyQuest: QuestTile = {
  id: 9,
  type: "harmony",
  name: "Harmony",
  description: "Kingdom complete",
  points: 5,
};

/**
 * A kingdom whose size x size square around the castle is filled, minus
 * `missingDominoes` dominoes (2 tiles each) removed from the top row.
 */
const buildKingdom = (size: 5 | 7, missingDominoes = 0): Kingdom => {
  const kingdom = placeCastle(createEmptyKingdom());
  const half = (size - 1) / 2;
  for (let y = 4 - half; y <= 4 + half; y++) {
    for (let x = 4 - half; x <= 4 + half; x++) {
      if (kingdom[y]![x]!.type === "empty") {
        kingdom[y]![x] = { type: "wheat", crowns: 0 };
      }
    }
  }
  for (let i = 0; i < missingDominoes * 2; i++) {
    kingdom[4 - half]![4 - half + i] = { type: "empty", crowns: 0 };
  }
  return kingdom;
};

const scoreWith = (options: {
  playerCount: number;
  basic: BasicRules;
  kingdom: Kingdom;
  extra?: ExtraRule[];
  mode?: string;
  questTiles?: QuestTile[];
}): number[] => {
  const players = Array.from({ length: options.playerCount }, (_, i) =>
    createPlayerBuilder()
      .withId(`player${i + 1}-id`)
      .withName(`player${i + 1}`)
      .withKingdom(options.kingdom)
      .build(),
  );

  const game = {
    ...createGameBuilder<NextStep>()
      .withPlayers(players)
      .withMode({ name: options.mode ?? "Classic", description: "" })
      .withRules({ basic: options.basic, extra: options.extra ?? [] })
      .withNextAction<NextStep>({ type: "step", step: "result" })
      .build(),
    ...(options.questTiles && {
      ageOfGiants: { giantPool: 6, questTiles: options.questTiles },
    }),
  };

  return unwrap(getResultUseCase(game)).result.map((r) => r.details.points);
};

describe("Harmony / Homo Habilis / harmony quest: complete kingdom bonus", () => {
  test.each([
    1, 2, 3, 4,
  ])("Harmony grants +5 to a complete kingdom with %i player(s)", (playerCount) => {
    const points = scoreWith({
      playerCount,
      basic: rules.basic[playerCount]!,
      kingdom: buildKingdom(5),
      extra: [harmony],
    });
    expect(points).toEqual(Array(playerCount).fill(5));
  });

  test.each([
    1, 2, 3, 4,
  ])("Harmony grants nothing when a domino was discarded (%i player(s))", (playerCount) => {
    const points = scoreWith({
      playerCount,
      basic: rules.basic[playerCount]!,
      kingdom: buildKingdom(5, 1),
      extra: [harmony],
    });
    expect(points).toEqual(Array(playerCount).fill(0));
  });

  test("Harmony grants +5 to a complete 7x7 kingdom with The Mighty Duel", () => {
    const basic: BasicRules = {
      ...rules.basic[2]!,
      maxDominoes: 48,
      maxTurns: 12,
      maxKingdomSize: 7,
    };
    expect(
      scoreWith({
        playerCount: 2,
        basic,
        kingdom: buildKingdom(7),
        extra: [harmony],
      }),
    ).toEqual([5, 5]);
    // A complete 5x5 kingdom is not complete in a 7x7 game
    expect(
      scoreWith({
        playerCount: 2,
        basic,
        kingdom: buildKingdom(5),
        extra: [harmony],
      }),
    ).toEqual([0, 0]);
  });

  test("Homo Habilis grants +5 to a complete territory with 3 players (Origins)", () => {
    expect(
      scoreWith({
        playerCount: 3,
        basic: rules.basic[3]!,
        kingdom: buildKingdom(5),
        extra: [homoHabilis],
        mode: "KingdominoOrigins-Discovery",
      }),
    ).toEqual([5, 5, 5]);
  });

  test.each([
    2, 3, 4, 5,
  ])("Age of Giants harmony quest grants +5 to a complete kingdom with %i players", (playerCount) => {
    expect(
      scoreWith({
        playerCount,
        basic: rules.aogBasic![playerCount]!,
        kingdom: buildKingdom(5),
        mode: "AgeOfGiants",
        questTiles: [harmonyQuest],
      }),
    ).toEqual(Array(playerCount).fill(5));
    expect(
      scoreWith({
        playerCount,
        basic: rules.aogBasic![playerCount]!,
        kingdom: buildKingdom(5, 1),
        mode: "AgeOfGiants",
        questTiles: [harmonyQuest],
      }),
    ).toEqual(Array(playerCount).fill(0));
  });
});
