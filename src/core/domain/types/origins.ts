import type { Position } from "./kingdom.js";
import type { ObjectValues } from "./utils.js";

// ─── Origins Sub-Modes ───────────────────────────────────────────────

/**
 * The three gameplay modes within Kingdomino Origins.
 * Discovery is the base, Totem adds resources/totems, Tribe adds cavemen.
 */
export const originsSubModes = {
  discovery: "Discovery",
  totem: "Totem",
  tribe: "Tribe",
} as const;

export type OriginsSubMode = ObjectValues<typeof originsSubModes>;

// ─── Fire Tokens ─────────────────────────────────────────────────────

/**
 * Represents the pool of available fire tokens.
 * Discovery Mode starts with: 5×1-fire, 4×2-fire, 1×3-fire = 10 total.
 */
export type FireTokenPool = {
  ones: number;
  twos: number;
  threes: number;
};

/**
 * A fire token that has been placed on a player's kingdom.
 */
export type PlacedFireToken = {
  /** Number of fires on this token (1, 2, or 3) */
  fires: 1 | 2 | 3;
  /** Position on the kingdom grid */
  position: Position;
};

/**
 * Tracks which volcano granted the current pending fire token,
 * so the placement validation knows the launch position.
 */
export type PendingFireToken = {
  /** Number of fires on the token to place */
  fires: 1 | 2 | 3;
  /** Position of the volcano that granted this token */
  volcanoPosition: Position;
};

// ─── Resources ───────────────────────────────────────────────────────

/**
 * Types of wooden resources in Origins.
 * Each maps to a specific terrain type.
 */
export const resourceTypes = {
  mammoth: "mammoth",
  fish: "fish",
  mushroom: "mushroom",
  flint: "flint",
} as const;

export type ResourceType = ObjectValues<typeof resourceTypes>;

/**
 * A wooden resource placed on a player's kingdom tile.
 */
export type Resource = {
  /** Type of resource */
  type: ResourceType;
  /** Position on the kingdom grid */
  position: Position;
};

// ─── Totems ──────────────────────────────────────────────────────────

/**
 * Tracks which player holds each totem tile.
 * null means no player currently holds that totem.
 */
export type TotemState = Record<ResourceType, string | null>;

/**
 * Point values for each totem tile at end of game.
 */
export type TotemBonus = Record<ResourceType, number>;

// ─── Cavemen ─────────────────────────────────────────────────────────

/**
 * The 7 kinds of hunter-gatherers.
 * Each has a specific scoring rule based on surrounding resources.
 */
export const hunterGathererKinds = {
  /** Scores per mammoth adjacent */
  mammothHunter: "mammothHunter",
  /** Scores per fish adjacent */
  fisherman: "fisherman",
  /** Scores per mushroom adjacent */
  mushroomPicker: "mushroomPicker",
  /** Scores per flint adjacent */
  flintCollector: "flintCollector",
  /** Scores per unique resource type adjacent */
  trapper: "trapper",
  /** Scores per total resource adjacent (any type) */
  gatherer: "gatherer",
  /** Scores per fire symbol adjacent (Fire Lady) */
  fireLady: "fireLady",
} as const;

export type HunterGathererKind = ObjectValues<typeof hunterGathererKinds>;

/**
 * Warrior size categories with their power values.
 */
export const warriorTypes = {
  small: "small",
  amazon: "amazon",
  oafish: "oafish",
} as const;

export type WarriorType = ObjectValues<typeof warriorTypes>;

/**
 * Power values for each warrior type.
 */
export const WARRIOR_POWER: Record<WarriorType, number> = {
  small: 1,
  amazon: 2,
  oafish: 3,
};

/**
 * A hunter-gatherer caveman tile.
 */
export type HunterGathererTile = {
  kind: "hunterGatherer";
  id: number;
  /** Specific hunter-gatherer type determining scoring rule */
  hunterType: HunterGathererKind;
  /** Points per matching adjacent resource/symbol */
  pointsPerMatch: number;
};

/**
 * A warrior caveman tile.
 */
export type WarriorTile = {
  kind: "warrior";
  id: number;
  /** Warrior size category */
  warriorType: WarriorType;
  /** Combat power (1, 2, or 3) */
  power: number;
};

/** Discriminated union of all caveman tile types. */
export type CavemanTile = HunterGathererTile | WarriorTile;

/**
 * A caveman tile placed on a player's kingdom.
 */
export type PlacedCaveman = {
  caveman: CavemanTile;
  position: Position;
};

/**
 * The Cave board used in Tribe mode.
 * Shows 4 visible caveman tiles and a face-down draw pile.
 */
export type CaveBoard = {
  /** Up to 4 visible caveman tiles available for recruitment */
  visible: CavemanTile[];
  /** Face-down draw pile */
  drawPile: CavemanTile[];
};

// ─── Origins Game State ──────────────────────────────────────────────

/**
 * Complete Origins-specific game state.
 * Stored as an optional field on Game and only present in Origins modes.
 */
export type OriginsState = {
  /** Which Origins sub-mode is being played */
  subMode: OriginsSubMode;
  /** Available fire tokens pool */
  fireTokenPool: FireTokenPool;
  /** Pending fire token to place (set after placing a volcano domino) */
  pendingFireToken?: PendingFireToken;
  /** Totem holder state (Totem mode only) */
  totems?: TotemState;
  /** Cave board state (Tribe mode only) */
  caveBoard?: CaveBoard;
};
