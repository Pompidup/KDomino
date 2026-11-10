import jsonRules from "@adapter/jsonRules.js";
import {
  createEmptyKingdom,
  placeCastle,
} from "@core/domain/entities/kingdom.js";
import {
  computePlayerScore,
  computeScoreBreakdown,
  computeTerritories,
  isGameOver,
} from "@core/domain/entities/scoreBreakdown.js";
import type { QuestTile } from "@core/domain/types/ageOfGiants.js";
import type { BuildingTile } from "@core/domain/types/building.js";
import type { Ground } from "@core/domain/types/domino.js";
import type { Game, NextStep } from "@core/domain/types/game.js";
import type { Kingdom } from "@core/domain/types/kingdom.js";
import type { Player } from "@core/domain/types/player.js";
import type { ExtraRule } from "@core/domain/types/rule.js";
import { TranslationKey } from "@core/i18n/translations.js";
import { describe, expect, test } from "vitest";
import { createGameBuilder } from "../../builder/game.js";
import { createPlayerBuilder } from "../../builder/player.js";

const rules = jsonRules().getAll();

/** Kingdom with the castle at (4,4) and the given tiles. */
const kingdomWith = (
  tiles: { x: number; y: number; type: Ground; crowns?: number }[],
): Kingdom => {
  const kingdom = placeCastle(createEmptyKingdom());
  for (const { x, y, type, crowns = 0 } of tiles) {
    kingdom[y]![x] = { type, crowns };
  }
  return kingdom;
};

/** A complete 5x5 wheat kingdom around a centered castle (12 dominoes). */
const completeKingdom = (): Kingdom => {
  const tiles: { x: number; y: number; type: Ground; crowns?: number }[] = [];
  for (let y = 2; y <= 6; y++) {
    for (let x = 2; x <= 6; x++) {
      if (x === 4 && y === 4) continue;
      tiles.push({ x, y, type: "wheat", crowns: x === 2 && y === 2 ? 1 : 0 });
    }
  }
  return kingdomWith(tiles);
};

const rule = (name: string): ExtraRule => ({
  name,
  description: name,
  mode: [{ name: "Classic", description: "Classic" }],
});

const buildGame = (options: {
  players: Player[];
  mode?: string;
  extra?: ExtraRule[];
  over?: boolean;
  extension?: Partial<Game>;
}): Game => ({
  ...createGameBuilder<NextStep>()
    .withPlayers(options.players)
    .withMode({ name: options.mode ?? "Classic", description: "" })
    .withRules({ basic: rules.basic[2]!, extra: options.extra ?? [] })
    .withNextAction<NextStep>({
      type: "step",
      step: options.over === false ? "start" : "result",
    })
    .build(),
  ...options.extension,
});

const playerWith = (kingdom: Kingdom, extra: Partial<Player> = {}): Player => ({
  ...createPlayerBuilder()
    .withId("p1")
    .withName("Alice")
    .withKingdom(kingdom)
    .build(),
  ...extra,
});

describe("computeTerritories", () => {
  test("groups connected squares by terrain, castle excluded", () => {
    const kingdom = kingdomWith([
      { x: 5, y: 4, type: "forest", crowns: 1 },
      { x: 6, y: 4, type: "forest", crowns: 0 },
      { x: 3, y: 4, type: "sea", crowns: 2 },
    ]);

    expect(computeTerritories(kingdom)).toEqual([
      {
        terrain: "sea",
        cells: [{ x: 3, y: 4 }],
        crowns: 2,
        coveredCrowns: 0,
        points: 2,
      },
      {
        terrain: "forest",
        cells: [
          { x: 5, y: 4 },
          { x: 6, y: 4 },
        ],
        crowns: 1,
        coveredCrowns: 0,
        points: 2,
      },
    ]);
  });

  test("a giant covers one crown of its square", () => {
    const kingdom = kingdomWith([
      { x: 5, y: 4, type: "mine", crowns: 2 },
      { x: 6, y: 4, type: "mine", crowns: 1 },
    ]);

    const [mine] = computeTerritories(kingdom, [{ x: 5, y: 4 }]);
    expect(mine).toMatchObject({ crowns: 2, coveredCrowns: 1, points: 4 });
  });
});

describe("computeScoreBreakdown", () => {
  test("Harmony is only granted at the end of the game", () => {
    const player = playerWith(completeKingdom());
    const extra = [rule("The middle Kingdom"), rule("Harmony")];

    const live = computeScoreBreakdown(
      buildGame({ players: [player], extra, over: false }),
      player,
      false,
    );
    expect(live.bonuses).toEqual([
      {
        type: "middleKingdom",
        label: TranslationKey.RULE_MIDDLE_KINGDOM,
        points: 10,
        provisional: true,
      },
    ]);
    expect(live.total).toBe(24 + 10);

    const final = computeScoreBreakdown(
      buildGame({ players: [player], extra }),
      player,
      true,
    );
    expect(final.bonuses.map((b) => [b.type, b.points, b.provisional])).toEqual(
      [
        ["middleKingdom", 10, false],
        ["harmony", 5, false],
      ],
    );
    expect(final.total).toBe(24 + 10 + 5);
  });

  test("Origins rules use their own bonus types and labels", () => {
    const player = playerWith(completeKingdom());
    const game = buildGame({
      players: [player],
      mode: "KingdominoOrigins-Discovery",
      extra: [rule("Empire of Fire"), rule("Homo Habilis")],
    });

    expect(
      computeScoreBreakdown(game, player, true).bonuses.map((b) => [
        b.type,
        b.label,
        b.points,
      ]),
    ).toEqual([
      ["empireOfFire", TranslationKey.RULE_EMPIRE_OF_FIRE, 10],
      ["homoHabilis", TranslationKey.RULE_HOMO_HABILIS, 5],
    ]);
  });

  test("Queendomino: Queen for her host, wealth and one bonus per building", () => {
    const sawmill: BuildingTile = {
      id: 3,
      name: "The Sawmill",
      cost: 2,
      crowns: 0,
      towers: 0,
      endGameScoring: { type: "perTerrain", terrain: "forest", points: 1 },
    };
    const bakery: BuildingTile = {
      id: 1,
      name: "The Bakery",
      cost: 1,
      crowns: 0,
      towers: 0,
    };
    const kingdom = kingdomWith([
      { x: 5, y: 4, type: "forest", crowns: 1 },
      { x: 6, y: 4, type: "forest", crowns: 0 },
      { x: 7, y: 4, type: "forest", crowns: 0 },
    ]);
    const host = playerWith(kingdom, {
      coins: 8,
      buildings: [
        { building: sawmill, position: { x: 6, y: 4 } },
        { building: bakery, position: { x: 7, y: 4 } },
      ],
    });
    const other = { ...playerWith(kingdom), id: "p2", name: "Bob" };
    const game = buildGame({
      players: [host, other],
      mode: "QueenDomino",
      over: false,
      extension: {
        queendomino: {
          buildersBoard: { slots: [], drawPile: [] },
          queenHolderId: "p1",
          dragonAvailable: true,
          dragonUsedThisRound: false,
        },
      },
    });

    const score = computePlayerScore(game, host);
    expect(score.final).toBe(false);
    expect(score.breakdown.bonuses).toEqual([
      {
        type: "queen",
        label: TranslationKey.SCORE_QUEEN,
        points: 3,
        provisional: true,
      },
      {
        // 1 point per 3 unused coins: 8 coins = 2 points
        type: "wealth",
        label: TranslationKey.SCORE_WEALTH,
        points: 2,
        provisional: true,
      },
      {
        type: "building",
        label: TranslationKey.SCORE_BUILDING,
        labelParams: { name: "The Sawmill" },
        points: 3,
        provisional: true,
        buildingId: 3,
        position: { x: 6, y: 4 },
      },
    ]);
    expect(score.points).toBe(3 + 3 + 2 + 3);
    expect(computePlayerScore(game, other).breakdown.bonuses).toEqual([
      {
        type: "wealth",
        label: TranslationKey.SCORE_WEALTH,
        points: 0,
        provisional: true,
      },
    ]);
  });

  test("Totem: resources and the totems held by resource majority", () => {
    const kingdom = kingdomWith([{ x: 5, y: 4, type: "forest" }]);
    const alice = playerWith(kingdom, {
      resources: [
        { type: "mammoth", position: { x: 5, y: 4 } },
        { type: "mammoth", position: { x: 5, y: 4 } },
      ],
    });
    const bob = {
      ...playerWith(kingdom, {
        resources: [{ type: "mammoth", position: { x: 5, y: 4 } }],
      }),
      id: "p2",
      name: "Bob",
    };
    const game = buildGame({
      players: [alice, bob],
      mode: "KingdominoOrigins-Totem",
      extension: {
        origins: {
          totems: { mammoth: "p2", fish: null, mushroom: null, flint: null },
        } as Game["origins"],
      },
    });

    expect(computeScoreBreakdown(game, alice, true).bonuses).toEqual([
      {
        type: "resources",
        label: TranslationKey.SCORE_RESOURCES,
        points: 2,
        provisional: false,
      },
      {
        type: "totem",
        label: TranslationKey.SCORE_TOTEM_MAMMOTH,
        points: 3,
        provisional: false,
        resource: "mammoth",
      },
    ]);
  });

  test("Tribe: one bonus per hunter-gatherer plus the warrior groups", () => {
    const kingdom = kingdomWith([
      { x: 5, y: 4, type: "forest" },
      { x: 6, y: 4, type: "forest" },
      { x: 5, y: 5, type: "forest" },
    ]);
    const player = playerWith(kingdom, {
      resources: [{ type: "fish", position: { x: 6, y: 4 } }],
      cavemen: [
        {
          caveman: {
            kind: "hunterGatherer",
            id: 1,
            hunterType: "fisherman",
            pointsPerMatch: 3,
          },
          position: { x: 5, y: 4 },
        },
        {
          caveman: { kind: "warrior", id: 2, warriorType: "amazon", power: 2 },
          position: { x: 5, y: 5 },
        },
      ],
    });
    const game = buildGame({
      players: [player],
      mode: "KingdominoOrigins-Tribe",
    });

    expect(computeScoreBreakdown(game, player, true).bonuses).toEqual([
      {
        type: "hunterGatherer",
        label: TranslationKey.CAVEMAN_FISHERMAN,
        points: 3,
        provisional: false,
        cavemanId: 1,
        position: { x: 5, y: 4 },
      },
      {
        type: "warriors",
        label: TranslationKey.SCORE_WARRIORS,
        points: 2,
        provisional: false,
      },
    ]);
  });

  test("Age of Giants: the Harmony quest only counts at the end", () => {
    const quests: QuestTile[] = [
      {
        id: 1,
        type: "localTrade",
        name: "Local Trade - Wheat",
        description: "",
        points: 5,
        terrain: "wheat",
      },
      {
        id: 9,
        type: "harmony",
        name: "Harmony",
        description: "",
        points: 5,
      },
    ];
    const player = playerWith(completeKingdom());
    const extension = { ageOfGiants: { giantPool: 6, questTiles: quests } };

    const live = computeScoreBreakdown(
      buildGame({
        players: [player],
        mode: "AgeOfGiants",
        over: false,
        extension,
      }),
      player,
      false,
    );
    expect(live.bonuses).toEqual([
      {
        type: "quest",
        label: TranslationKey.QUEST_LOCAL_TRADE,
        points: 40,
        provisional: true,
        questId: 1,
        questType: "localTrade",
        terrain: "wheat",
      },
    ]);

    const final = computeScoreBreakdown(
      buildGame({ players: [player], mode: "AgeOfGiants", extension }),
      player,
      true,
    );
    expect(final.bonuses.map((b) => [b.questType, b.points])).toEqual([
      ["localTrade", 40],
      ["harmony", 5],
    ]);
  });
});

describe("isGameOver", () => {
  test("is true only at the result step", () => {
    expect(isGameOver({ nextAction: { type: "step", step: "result" } })).toBe(
      true,
    );
    expect(isGameOver({ nextAction: { type: "step", step: "start" } })).toBe(
      false,
    );
    expect(
      isGameOver({
        nextAction: {
          type: "action",
          nextLord: "lord",
          nextAction: "pickDomino",
        },
      }),
    ).toBe(false);
  });
});
