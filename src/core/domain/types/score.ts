import type { TranslationKeyType } from "@core/i18n/translations.js";
import type { QuestType } from "./ageOfGiants.js";
import type { Ground } from "./domino.js";
import type { Position } from "./kingdom.js";
import type { ResourceType } from "./origins.js";
import type { ObjectValues } from "./utils.js";

/**
 * One scored territory (a group of orthogonally connected squares of the
 * same terrain) of a kingdom. The castle is never part of a territory.
 */
export type ScoreTerritory = {
  /** Terrain shared by every square of the territory */
  terrain: Ground;
  /** Squares of the territory, sorted by row then column */
  cells: Position[];
  /**
   * Crowns counted for scoring (Origins: fire symbols). Crowns covered by an
   * Age of Giants giant are not counted.
   */
  crowns: number;
  /** Crowns of the territory covered by giants (not counted in `crowns`) */
  coveredCrowns: number;
  /** Points scored by the territory: `cells.length * crowns` */
  points: number;
};

/**
 * Kinds of bonus that can appear in a score breakdown.
 */
export const scoreBonusTypes = {
  /** "The middle Kingdom" optional rule: castle in the middle (+10) */
  middleKingdom: "middleKingdom",
  /** "Empire of Fire" optional rule (Origins): hut in the middle (+10) */
  empireOfFire: "empireOfFire",
  /** "Harmony" optional rule: complete kingdom, no discarded domino (+5) */
  harmony: "harmony",
  /** "Homo Habilis" optional rule (Origins): complete territory (+5) */
  homoHabilis: "homoHabilis",
  /** Queendomino: the Queen counts as an extra crown on the largest territory */
  queen: "queen",
  /** Queendomino: end-game scoring of one constructed building */
  building: "building",
  /** Queendomino: Wealth, 1 point per 3 unused coins */
  wealth: "wealth",
  /** Age of Giants: one quest tile */
  quest: "quest",
  /** Origins Totem: one totem held by the player */
  totem: "totem",
  /** Origins Totem: 1 point per wooden resource left in the kingdom */
  resources: "resources",
  /** Origins Tribe: one hunter-gatherer */
  hunterGatherer: "hunterGatherer",
  /** Origins Tribe: every warrior group */
  warriors: "warriors",
  /** Origins: fire tokens placed in the kingdom's territories */
  fire: "fire",
} as const;

/** Union of every bonus kind */
export type ScoreBonusType = ObjectValues<typeof scoreBonusTypes>;

/**
 * One bonus of a score breakdown.
 */
export type ScoreBonus = {
  /** Kind of bonus */
  type: ScoreBonusType;
  /**
   * Translation key of the bonus name (see `TranslationKey`). Translate it
   * with `translator.t(bonus.label, bonus.labelParams)`.
   */
  label: TranslationKeyType;
  /** Interpolation parameters of the label (e.g. the building name) */
  labelParams?: Record<string, string | number>;
  /** Points granted by the bonus (may be 0 when its condition is not met) */
  points: number;
  /**
   * `true` while the game is in progress: the bonus is evaluated on the
   * current state and may still change (or disappear) before the end of the
   * game. `false` once the game is over.
   */
  provisional: boolean;
  /** Building id (`building` bonuses) */
  buildingId?: number;
  /** Quest tile id (`quest` bonuses) */
  questId?: number;
  /** Quest type (`quest` bonuses) */
  questType?: QuestType;
  /** Target terrain of the quest (Local Trade, Kingdom Borders) */
  terrain?: Ground;
  /** Resource of the totem (`totem` bonuses) */
  resource?: ResourceType;
  /** Caveman tile id (`hunterGatherer` bonuses) */
  cavemanId?: number;
  /** Kingdom position the bonus relates to (building, hunter-gatherer) */
  position?: Position;
};

/**
 * Detailed score of one kingdom.
 * Invariant: `total === territoryPoints + bonusPoints`, where
 * `territoryPoints` is the sum of the territory points and `bonusPoints`
 * the sum of the bonus points.
 */
export type ScoreBreakdown = {
  /** Every scored territory of the kingdom */
  territories: ScoreTerritory[];
  /** Every bonus applying to the player in the current game mode */
  bonuses: ScoreBonus[];
  /** Sum of the territory points */
  territoryPoints: number;
  /** Sum of the bonus points */
  bonusPoints: number;
  /** Total score: `territoryPoints + bonusPoints` */
  total: number;
};

/**
 * Mode-aware score of one player, as returned by `calculatePlayerScore`.
 */
export type PlayerScore = {
  /** Player's unique identifier */
  playerId: string;
  /** Player's display name */
  playerName: string;
  /** Total score (same as `breakdown.total`) */
  points: number;
  /** Size of the largest territory (tie-breaker) */
  maxPropertiesSize: number;
  /** Total crowns counted in the kingdom */
  totalCrowns: number;
  /**
   * `true` when the game is over: the score is the final score, identical
   * to the one returned by `getResults`. `false` during the game: the score
   * is a live estimate of the current state (provisional bonuses; Harmony,
   * Homo Habilis and the Harmony quest count their points while the complete
   * kingdom is still reachable).
   */
  final: boolean;
  /** Detailed score */
  breakdown: ScoreBreakdown;
};
