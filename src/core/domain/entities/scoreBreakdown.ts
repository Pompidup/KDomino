/**
 * Mode-aware score breakdown: the single source of truth of every score
 * computed by the engine (`calculatePlayerScore` during and after the game,
 * `getResults` at the end of the game).
 *
 * Live (game in progress) vs final (game over):
 * - territories, Middle Kingdom / Empire of Fire, the Queen (current holder),
 *   buildings, Queendomino wealth (current coins), fire tokens, resources and totems (current majority holders),
 *   cavemen and every quest except Harmony are evaluated on the current state
 *   during the game and flagged `provisional: true`;
 * - Harmony, Homo Habilis and the Harmony quest require the complete kingdom
 *   (every received domino placed): they are only granted at the end of the
 *   game and are left out of the live breakdown.
 */
import type { QuestTile } from "@core/domain/types/ageOfGiants.js";
import { questTypes } from "@core/domain/types/ageOfGiants.js";
import type { Game } from "@core/domain/types/game.js";
import type { Kingdom, Position } from "@core/domain/types/kingdom.js";
import { resourceTypes } from "@core/domain/types/origins.js";
import type { Player } from "@core/domain/types/player.js";
import type {
  PlayerScore,
  ScoreBonus,
  ScoreBreakdown,
  ScoreTerritory,
} from "@core/domain/types/score.js";
import {
  hunterGathererKindToTranslationKey,
  questTypeToTranslationKey,
  TranslationKey,
  totemToTranslationKey,
} from "@core/i18n/translations.js";
import { isAgeOfGiantsMode } from "./ageOfGiantsHelpers.js";
import {
  calculateHunterGathererScore,
  calculateWarriorGroupScore,
} from "./caveman.js";
import { getWealthPoints } from "./economy.js";
import { checkCastleIsInMiddle, countDominoes } from "./kingdom.js";
import { isOriginsMode, isTotemMode, isTribeMode } from "./originsHelpers.js";
import { calculateOriginsFireBonus } from "./originsScore.js";
import { calculateBuildingEndGameScore, getQueenBonus } from "./queen.js";
import { calculateQuestBonus } from "./questScore.js";
import { determineTotemHolders, TOTEM_BONUSES } from "./totem.js";

/** Points of "The middle Kingdom" / "Empire of Fire" */
const MIDDLE_KINGDOM_POINTS = 10;
/** Points of "Harmony" / "Homo Habilis" */
const HARMONY_POINTS = 5;

const DIRECTIONS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

/**
 * Splits a kingdom into its scored territories (orthogonally connected
 * squares of the same terrain, castle excluded). A giant covering a square
 * removes one of its crowns.
 */
export const computeTerritories = (
  kingdom: Kingdom,
  giantPositions: Position[] = [],
): ScoreTerritory[] => {
  const rows = kingdom.length;
  const cols = kingdom[0]?.length ?? 0;
  const visited: boolean[][] = kingdom.map((row) => row.map(() => false));
  const giantSet = new Set(giantPositions.map((p) => `${p.x},${p.y}`));
  const territories: ScoreTerritory[] = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const tile = kingdom[y]![x]!;
      if (visited[y]![x] || tile.type === "empty" || tile.type === "castle") {
        continue;
      }

      const terrain = tile.type;
      const cells: Position[] = [];
      let crowns = 0;
      let coveredCrowns = 0;
      const queue: [number, number][] = [[x, y]];
      visited[y]![x] = true;

      while (queue.length > 0) {
        const [cx, cy] = queue.pop()!;
        const current = kingdom[cy]![cx]!;
        cells.push({ x: cx, y: cy });

        const counted = giantSet.has(`${cx},${cy}`)
          ? Math.max(0, current.crowns - 1)
          : current.crowns;
        crowns += counted;
        coveredCrowns += current.crowns - counted;

        for (const [dx, dy] of DIRECTIONS) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (
            nx >= 0 &&
            ny >= 0 &&
            nx < cols &&
            ny < rows &&
            !visited[ny]![nx] &&
            kingdom[ny]![nx]!.type === terrain
          ) {
            visited[ny]![nx] = true;
            queue.push([nx, ny]);
          }
        }
      }

      cells.sort((a, b) => a.y - b.y || a.x - b.x);
      territories.push({
        terrain,
        cells,
        crowns,
        coveredCrowns,
        points: cells.length * crowns,
      });
    }
  }

  return territories;
};

/**
 * True once the game is over (the `result` step is reached).
 */
export const isGameOver = (game: Pick<Game, "nextAction">): boolean =>
  game.nextAction.type === "step" && game.nextAction.step === "result";

/** Every domino a player receives over the game (one per lord and turn). */
const dominoesReceivedPerPlayer = (game: Game): number =>
  game.rules.basic.lords * game.rules.basic.maxTurns;

const queendominoBonuses = (
  game: Game,
  player: Player,
  provisional: boolean,
): ScoreBonus[] => {
  if (!game.queendomino) return [];
  const bonuses: ScoreBonus[] = [];

  // The Queen: extra crown on the largest territory of her host
  if (
    game.queendomino.queenHolderId !== null &&
    game.queendomino.queenHolderId === player.id
  ) {
    bonuses.push({
      type: "queen",
      label: TranslationKey.SCORE_QUEEN,
      points: getQueenBonus(player.kingdom),
      provisional,
    });
  }

  // Wealth: 1 point for every 3 unused coins (official "End of the Game")
  bonuses.push({
    type: "wealth",
    label: TranslationKey.SCORE_WEALTH,
    points: getWealthPoints(player),
    provisional,
  });

  // Buildings with an end-game scoring condition
  for (const placed of player.buildings ?? []) {
    if (!placed.building.endGameScoring) continue;
    bonuses.push({
      type: "building",
      label: TranslationKey.SCORE_BUILDING,
      labelParams: { name: placed.building.name },
      points: calculateBuildingEndGameScore(placed, player),
      provisional,
      buildingId: placed.building.id,
      position: placed.position,
    });
  }

  return bonuses;
};

const originsBonuses = (
  game: Game,
  player: Player,
  provisional: boolean,
): ScoreBonus[] => {
  const modeName = game.mode.name;
  if (!isOriginsMode(modeName)) return [];
  const bonuses: ScoreBonus[] = [];
  const fireTokens = player.fireTokens ?? [];
  const resources = player.resources ?? [];

  // Fire tokens: each region scores its size × fires of its tokens
  if (fireTokens.length > 0) {
    bonuses.push({
      type: "fire",
      label: TranslationKey.SCORE_FIRE,
      points: calculateOriginsFireBonus(player.kingdom, fireTokens),
      provisional,
    });
  }

  // Totem mode: 1 point per resource + bonus of every totem held. Holders
  // are re-evaluated from the resource majority of the current state.
  if (isTotemMode(modeName) && game.origins?.totems) {
    bonuses.push({
      type: "resources",
      label: TranslationKey.SCORE_RESOURCES,
      points: resources.length,
      provisional,
    });

    const holders = determineTotemHolders(game.players, game.origins.totems);
    for (const resource of Object.values(resourceTypes)) {
      if (holders[resource] !== player.id) continue;
      bonuses.push({
        type: "totem",
        label: totemToTranslationKey[resource],
        points: TOTEM_BONUSES[resource],
        provisional,
        resource,
      });
    }
  }

  // Tribe mode: every hunter-gatherer, then the warrior groups
  const cavemen = player.cavemen ?? [];
  if (isTribeMode(modeName) && cavemen.length > 0) {
    for (const placed of cavemen) {
      const { caveman } = placed;
      if (caveman.kind !== "hunterGatherer") continue;
      bonuses.push({
        type: "hunterGatherer",
        label: hunterGathererKindToTranslationKey[caveman.hunterType],
        points: calculateHunterGathererScore(
          placed,
          player.kingdom,
          resources,
          fireTokens,
        ),
        provisional,
        cavemanId: caveman.id,
        position: placed.position,
      });
    }

    if (cavemen.some((placed) => placed.caveman.kind === "warrior")) {
      bonuses.push({
        type: "warriors",
        label: TranslationKey.SCORE_WARRIORS,
        points: calculateWarriorGroupScore(cavemen),
        provisional,
      });
    }
  }

  return bonuses;
};

const questBonuses = (
  game: Game,
  player: Player,
  final: boolean,
): ScoreBonus[] => {
  if (!isAgeOfGiantsMode(game.mode.name) || !game.ageOfGiants?.questTiles) {
    return [];
  }
  const giants = player.giants ?? [];

  return game.ageOfGiants.questTiles
    .filter((quest: QuestTile) => final || quest.type !== questTypes.harmony)
    .map(
      (quest): ScoreBonus => ({
        type: "quest",
        label: questTypeToTranslationKey[quest.type],
        points: calculateQuestBonus(
          quest,
          player.kingdom,
          giants,
          dominoesReceivedPerPlayer(game),
        ),
        provisional: !final,
        questId: quest.id,
        questType: quest.type,
        ...(quest.terrain && { terrain: quest.terrain }),
      }),
    );
};

const extraRuleBonuses = (
  game: Game,
  player: Player,
  final: boolean,
): ScoreBonus[] => {
  const bonuses: ScoreBonus[] = [];
  const provisional = !final;

  for (const extraRule of game.rules.extra) {
    // Castle in the middle: "The middle Kingdom" (Classic/QD) or
    // "Empire of Fire" (Origins)
    if (
      extraRule.name === "The middle Kingdom" ||
      extraRule.name === "Empire of Fire"
    ) {
      const isMiddleKingdom = extraRule.name === "The middle Kingdom";
      bonuses.push({
        type: isMiddleKingdom ? "middleKingdom" : "empireOfFire",
        label: isMiddleKingdom
          ? TranslationKey.RULE_MIDDLE_KINGDOM
          : TranslationKey.RULE_EMPIRE_OF_FIRE,
        points: checkCastleIsInMiddle(player.kingdom)
          ? MIDDLE_KINGDOM_POINTS
          : 0,
        provisional,
      });
    }

    // Complete kingdom: "Harmony" (Classic/QD) or "Homo Habilis" (Origins).
    // Every domino the player received must be in the kingdom (none was
    // discarded): only decidable at the end of the game.
    if (
      final &&
      (extraRule.name === "Harmony" || extraRule.name === "Homo Habilis")
    ) {
      const isHarmony = extraRule.name === "Harmony";
      bonuses.push({
        type: isHarmony ? "harmony" : "homoHabilis",
        label: isHarmony
          ? TranslationKey.RULE_HARMONY
          : TranslationKey.RULE_HOMO_HABILIS,
        points:
          countDominoes(player.kingdom) === dominoesReceivedPerPlayer(game)
            ? HARMONY_POINTS
            : 0,
        provisional,
      });
    }
  }

  return bonuses;
};

const sum = (values: { points: number }[]): number =>
  values.reduce((total, value) => total + value.points, 0);

/**
 * Computes the mode-aware score breakdown of one player.
 *
 * @param final - `true` to score the end of the game (end-of-game-only
 * bonuses included, nothing provisional), `false` for a live score.
 */
export const computeScoreBreakdown = (
  game: Game,
  player: Player,
  final: boolean,
): ScoreBreakdown => {
  const territories = computeTerritories(
    player.kingdom,
    player.giants?.map((g) => g.position),
  );
  const provisional = !final;

  const bonuses: ScoreBonus[] = [
    ...queendominoBonuses(game, player, provisional),
    ...originsBonuses(game, player, provisional),
    ...questBonuses(game, player, final),
    ...extraRuleBonuses(game, player, final),
  ];

  const territoryPoints = sum(territories);
  const bonusPoints = sum(bonuses);

  return {
    territories,
    bonuses,
    territoryPoints,
    bonusPoints,
    total: territoryPoints + bonusPoints,
  };
};

/**
 * Computes the mode-aware score of one player. The score is final when the
 * game is over (`isGameOver`), live otherwise.
 */
export const computePlayerScore = (
  game: Game,
  player: Player,
  final: boolean = isGameOver(game),
): PlayerScore => {
  const breakdown = computeScoreBreakdown(game, player, final);
  const { territories } = breakdown;
  const totalCrowns = territories.reduce(
    (total, territory) => total + territory.crowns,
    0,
  );

  return {
    playerId: player.id,
    playerName: player.name,
    points: breakdown.total,
    maxPropertiesSize: territories.reduce(
      (max, territory) => Math.max(max, territory.cells.length),
      0,
    ),
    totalCrowns,
    ...(isOriginsMode(game.mode.name) && {
      fireSymbols:
        totalCrowns +
        (player.fireTokens ?? []).reduce((total, t) => total + t.fires, 0),
    }),
    final,
    breakdown,
  };
};
