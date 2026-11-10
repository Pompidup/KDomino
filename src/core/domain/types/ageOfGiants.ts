import type { Ground } from "./domino.js";
import type { Position } from "./kingdom.js";
import type { ObjectValues } from "./utils.js";

// ─── Giants ─────────────────────────────────────────────────────────

/**
 * A giant placed on a player's kingdom, covering a crown.
 * The covered crown does not count for scoring.
 */
export type PlacedGiant = {
  /** Position on the kingdom grid where the giant covers a crown */
  position: Position;
};

// ─── Quest Tiles ────────────────────────────────────────────────────

/**
 * All quest tile types available in Age of Giants.
 */
export const questTypes = {
  /** 5pts per matching terrain tile adjacent (8-dir) to castle */
  localTrade: "localTrade",
  /** 5pts per matching terrain tile in the 4 corners of the kingdom */
  kingdomBorders: "kingdomBorders",
  /** 5pts if kingdom is complete (no discarded dominos) */
  harmony: "harmony",
  /** 10pts if castle is in the center of the kingdom */
  middleKingdom: "middleKingdom",
  /** 20pts if castle is in one of the 4 corners of the kingdom */
  lostCorner: "lostCorner",
  /** 10pts per alignment of 3+ tiles with crowns (H/V/diagonal) */
  megalomania: "megalomania",
  /** 10pts per property of 5+ wheat/forest/sea/plain tiles with 0 crowns */
  austereKing: "austereKing",
} as const;

export type QuestType = ObjectValues<typeof questTypes>;

/**
 * A quest tile drawn at game start.
 * Provides a specific end-of-game bonus scoring condition.
 */
export type QuestTile = {
  /** Unique identifier for the quest tile */
  id: number;
  /** Type of quest determining the scoring rule */
  type: QuestType;
  /** Display name of the quest */
  name: string;
  /** Description of the scoring condition */
  description: string;
  /** Points awarded per match (e.g., 5 for localTrade, 10 for megalomania) */
  points: number;
  /** Target terrain type (only for localTrade and kingdomBorders quests) */
  terrain?: Ground;
};

// ─── Age of Giants Game State ───────────────────────────────────────

/**
 * A giant sent with `sendGiant` that the targeted opponent must now place on
 * one of their own crowns (official rule: the opponent chooses the crown).
 * While it is set, `nextAction` is `placeGiant` for a lord of the target.
 */
export type PendingGiant = {
  /** Lord who sent the giant; their turn resumes once the giant is placed */
  fromLordId: string;
  /** Player who received the giant and must choose the crown */
  targetPlayerId: string;
};

/**
 * Complete Age of Giants-specific game state.
 * Stored as an optional field on Game and only present in AoG modes.
 */
export type AgeOfGiantsState = {
  /** Number of giant figurines remaining in the pool (starts at 6) */
  giantPool: number;
  /** The 2 quest tiles drawn for this game */
  questTiles: QuestTile[];
  /** Giant sent to an opponent, waiting for that opponent to choose a crown */
  pendingGiant?: PendingGiant;
};
