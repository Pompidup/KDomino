import {
  ErrorCode,
  type ErrorCodeType,
} from "@core/domain/errors/domainErrors.js";

/**
 * Translation keys for internationalization support.
 * Use these keys instead of hardcoded strings for translatable content.
 */
export const TranslationKey = {
  // Error messages
  ERROR_INVALID_STEP: "error.invalidStep",
  ERROR_STEP_EXECUTION_FAILED: "error.stepExecutionFailed",
  ERROR_ACTION_EXECUTION_FAILED: "error.actionExecutionFailed",
  ERROR_LORD_NOT_FOUND: "error.lordNotFound",
  ERROR_PLAYER_NOT_FOUND: "error.playerNotFound",
  ERROR_DOMINO_NOT_FOUND: "error.dominoNotFound",
  ERROR_MODE_NOT_FOUND: "error.modeNotFound",
  ERROR_INVALID_PLACEMENT: "error.invalidPlacement",
  ERROR_PLACEMENT_NOT_EMPTY: "error.placementNotEmpty",
  ERROR_PLACEMENT_NOT_ADJACENT: "error.placementNotAdjacent",
  ERROR_PLACEMENT_INVALID_TERRAIN: "error.placementInvalidTerrain",
  ERROR_PLACEMENT_OUT_OF_BOUNDS: "error.placementOutOfBounds",
  ERROR_PLACEMENT_EXCEEDS_KINGDOM_SIZE: "error.placementExceedsKingdomSize",
  ERROR_NOT_YOUR_TURN: "error.notYourTurn",
  ERROR_CANNOT_PICK: "error.cannotPick",
  ERROR_CANNOT_PLACE: "error.cannotPlace",
  ERROR_DOMINO_ALREADY_PICKED: "error.dominoAlreadyPicked",
  ERROR_INVALID_PLAYER_COUNT: "error.invalidPlayerCount",
  ERROR_INVALID_PLAYER_NAME: "error.invalidPlayerName",
  ERROR_UNDO_UNAVAILABLE: "error.undoUnavailable",
  ERROR_REDO_UNAVAILABLE: "error.redoUnavailable",

  // Game mode names
  MODE_CLASSIC: "mode.classic",

  // Extra rule names
  RULE_MIDDLE_KINGDOM: "rule.middleKingdom",
  RULE_HARMONY: "rule.harmony",

  // Ground types
  GROUND_CASTLE: "ground.castle",
  GROUND_WHEAT: "ground.wheat",
  GROUND_FOREST: "ground.forest",
  GROUND_SEA: "ground.sea",
  GROUND_PLAIN: "ground.plain",
  GROUND_SWAMP: "ground.swamp",
  GROUND_MINE: "ground.mine",

  // Game phases
  PHASE_ADD_PLAYERS: "phase.addPlayers",
  PHASE_OPTIONS: "phase.options",
  PHASE_START: "phase.start",
  PHASE_RESULT: "phase.result",

  // Actions
  ACTION_PICK_DOMINO: "action.pickDomino",
  ACTION_PLACE_DOMINO: "action.placeDomino",
  ACTION_PASS: "action.pass",

  // Queendomino errors
  ERROR_CANNOT_PLACE_KNIGHT: "error.cannotPlaceKnight",
  ERROR_MAX_KNIGHTS_REACHED: "error.maxKnightsReached",
  ERROR_KNIGHT_TERRITORY_OCCUPIED: "error.knightTerritoryOccupied",
  ERROR_CANNOT_AFFORD_BUILDING: "error.cannotAffordBuilding",
  ERROR_NO_CONSTRUCTION_SQUARE: "error.noConstructionSquare",
  ERROR_DRAGON_UNAVAILABLE: "error.dragonUnavailable",
  ERROR_QUEEN_HOLDER_CANNOT_USE_DRAGON: "error.queenHolderCannotUseDragon",
  ERROR_BUILDING_NOT_FOUND: "error.buildingNotFound",
  ERROR_INVALID_OPTIONAL_ACTION: "error.invalidOptionalAction",

  // Age of Giants errors
  ERROR_GIANT_POOL_EMPTY: "error.giantPoolEmpty",
  ERROR_GIANT_NOT_FOUND: "error.giantNotFound",
  ERROR_INVALID_GIANT_PLACEMENT: "error.invalidGiantPlacement",
  ERROR_NOT_AOG_MODE: "error.notAogMode",

  // Origins errors
  ERROR_FIRE_TOKEN_POOL_EMPTY: "error.fireTokenPoolEmpty",
  ERROR_FIRE_TOKEN_INVALID_POSITION: "error.fireTokenInvalidPosition",
  ERROR_NO_PENDING_FIRE_TOKEN: "error.noPendingFireToken",
  ERROR_CANNOT_RECRUIT_CAVEMAN: "error.cannotRecruitCaveman",
  ERROR_INSUFFICIENT_RESOURCES: "error.insufficientResources",
  ERROR_INVALID_CAVEMAN_PLACEMENT: "error.invalidCavemanPlacement",
  ERROR_CAVEMAN_NOT_FOUND: "error.cavemanNotFound",
  ERROR_NOT_TRIBE_MODE: "error.notTribeMode",
} as const;

export type TranslationKeyType =
  (typeof TranslationKey)[keyof typeof TranslationKey];

/**
 * Default English translations.
 */
export const defaultTranslations: Record<TranslationKeyType, string> = {
  // Error messages
  [TranslationKey.ERROR_INVALID_STEP]: "Invalid game step",
  [TranslationKey.ERROR_STEP_EXECUTION_FAILED]: "Step execution failed",
  [TranslationKey.ERROR_ACTION_EXECUTION_FAILED]: "Action execution failed",
  [TranslationKey.ERROR_LORD_NOT_FOUND]: "Lord not found",
  [TranslationKey.ERROR_PLAYER_NOT_FOUND]: "Player not found",
  [TranslationKey.ERROR_DOMINO_NOT_FOUND]: "Domino not found",
  [TranslationKey.ERROR_MODE_NOT_FOUND]: "Game mode not found",
  [TranslationKey.ERROR_INVALID_PLACEMENT]: "Invalid placement",
  [TranslationKey.ERROR_PLACEMENT_NOT_EMPTY]: "Position is not empty",
  [TranslationKey.ERROR_PLACEMENT_NOT_ADJACENT]:
    "Not adjacent to existing tiles",
  [TranslationKey.ERROR_PLACEMENT_INVALID_TERRAIN]:
    "Terrain type does not match",
  [TranslationKey.ERROR_PLACEMENT_OUT_OF_BOUNDS]: "Placement is out of bounds",
  [TranslationKey.ERROR_PLACEMENT_EXCEEDS_KINGDOM_SIZE]:
    "Placement exceeds kingdom size",
  [TranslationKey.ERROR_NOT_YOUR_TURN]: "It is not your turn",
  [TranslationKey.ERROR_CANNOT_PICK]: "Cannot pick a domino now",
  [TranslationKey.ERROR_CANNOT_PLACE]: "Cannot place a domino now",
  [TranslationKey.ERROR_DOMINO_ALREADY_PICKED]:
    "Domino has already been picked",
  [TranslationKey.ERROR_INVALID_PLAYER_COUNT]:
    "Invalid number of players (1-4 required)",
  [TranslationKey.ERROR_INVALID_PLAYER_NAME]:
    "Player name must be at least 3 characters",
  [TranslationKey.ERROR_UNDO_UNAVAILABLE]: "No state to undo",
  [TranslationKey.ERROR_REDO_UNAVAILABLE]: "No state to redo",

  // Game mode names
  [TranslationKey.MODE_CLASSIC]: "Classic",

  // Extra rule names
  [TranslationKey.RULE_MIDDLE_KINGDOM]: "The Middle Kingdom",
  [TranslationKey.RULE_HARMONY]: "Harmony",

  // Ground types
  [TranslationKey.GROUND_CASTLE]: "Castle",
  [TranslationKey.GROUND_WHEAT]: "Wheat Field",
  [TranslationKey.GROUND_FOREST]: "Forest",
  [TranslationKey.GROUND_SEA]: "Sea",
  [TranslationKey.GROUND_PLAIN]: "Plain",
  [TranslationKey.GROUND_SWAMP]: "Swamp",
  [TranslationKey.GROUND_MINE]: "Mine",

  // Game phases
  [TranslationKey.PHASE_ADD_PLAYERS]: "Add Players",
  [TranslationKey.PHASE_OPTIONS]: "Game Options",
  [TranslationKey.PHASE_START]: "Start Game",
  [TranslationKey.PHASE_RESULT]: "Game Results",

  // Actions
  [TranslationKey.ACTION_PICK_DOMINO]: "Pick Domino",
  [TranslationKey.ACTION_PLACE_DOMINO]: "Place Domino",
  [TranslationKey.ACTION_PASS]: "Pass",

  // Queendomino errors
  [TranslationKey.ERROR_CANNOT_PLACE_KNIGHT]: "Cannot place knight here",
  [TranslationKey.ERROR_MAX_KNIGHTS_REACHED]:
    "Maximum number of knights reached (3)",
  [TranslationKey.ERROR_KNIGHT_TERRITORY_OCCUPIED]:
    "This territory already has a knight",
  [TranslationKey.ERROR_CANNOT_AFFORD_BUILDING]:
    "Not enough coins to purchase this building",
  [TranslationKey.ERROR_NO_CONSTRUCTION_SQUARE]:
    "No open construction square available",
  [TranslationKey.ERROR_DRAGON_UNAVAILABLE]:
    "The Dragon is not available this round",
  [TranslationKey.ERROR_QUEEN_HOLDER_CANNOT_USE_DRAGON]:
    "The Queen holder cannot use the Dragon",
  [TranslationKey.ERROR_BUILDING_NOT_FOUND]:
    "Building not found on the Builders Board",
  [TranslationKey.ERROR_INVALID_OPTIONAL_ACTION]:
    "Invalid optional action for this game state",

  // Age of Giants errors
  [TranslationKey.ERROR_GIANT_POOL_EMPTY]: "No giants remaining in the pool",
  [TranslationKey.ERROR_GIANT_NOT_FOUND]: "Giant not found on the kingdom",
  [TranslationKey.ERROR_INVALID_GIANT_PLACEMENT]:
    "Invalid position for giant placement — must be an uncovered crown",
  [TranslationKey.ERROR_NOT_AOG_MODE]: "Age of Giants mode is not enabled",

  // Origins errors
  [TranslationKey.ERROR_FIRE_TOKEN_POOL_EMPTY]:
    "No fire tokens remaining in the pool",
  [TranslationKey.ERROR_FIRE_TOKEN_INVALID_POSITION]:
    "Invalid position for fire token placement",
  [TranslationKey.ERROR_NO_PENDING_FIRE_TOKEN]:
    "No pending fire token to place",
  [TranslationKey.ERROR_CANNOT_RECRUIT_CAVEMAN]: "Cannot recruit a caveman",
  [TranslationKey.ERROR_INSUFFICIENT_RESOURCES]:
    "Insufficient resources for this action",
  [TranslationKey.ERROR_INVALID_CAVEMAN_PLACEMENT]:
    "Invalid position for caveman placement",
  [TranslationKey.ERROR_CAVEMAN_NOT_FOUND]: "Caveman not found",
  [TranslationKey.ERROR_NOT_TRIBE_MODE]: "Tribe mode is not enabled",
};

/**
 * Maps ErrorCode values to their corresponding TranslationKey values.
 * Used by handlers to translate error codes into localized messages.
 */
export const errorCodeToTranslationKey: Record<
  ErrorCodeType,
  TranslationKeyType
> = {
  [ErrorCode.INVALID_STEP]: TranslationKey.ERROR_INVALID_STEP,
  [ErrorCode.STEP_EXECUTION_FAILED]: TranslationKey.ERROR_STEP_EXECUTION_FAILED,
  [ErrorCode.ACTION_EXECUTION_FAILED]:
    TranslationKey.ERROR_ACTION_EXECUTION_FAILED,
  [ErrorCode.LORD_NOT_FOUND]: TranslationKey.ERROR_LORD_NOT_FOUND,
  [ErrorCode.PLAYER_NOT_FOUND]: TranslationKey.ERROR_PLAYER_NOT_FOUND,
  [ErrorCode.DOMINO_NOT_FOUND]: TranslationKey.ERROR_DOMINO_NOT_FOUND,
  [ErrorCode.MODE_NOT_FOUND]: TranslationKey.ERROR_MODE_NOT_FOUND,
  [ErrorCode.INVALID_PLAYER_COUNT]: TranslationKey.ERROR_INVALID_PLAYER_COUNT,
  [ErrorCode.INVALID_PLAYER_NAME]: TranslationKey.ERROR_INVALID_PLAYER_NAME,
  [ErrorCode.INVALID_PLACEMENT]: TranslationKey.ERROR_INVALID_PLACEMENT,
  [ErrorCode.PLACEMENT_NOT_EMPTY]: TranslationKey.ERROR_PLACEMENT_NOT_EMPTY,
  [ErrorCode.PLACEMENT_NOT_ADJACENT]:
    TranslationKey.ERROR_PLACEMENT_NOT_ADJACENT,
  [ErrorCode.PLACEMENT_INVALID_TERRAIN]:
    TranslationKey.ERROR_PLACEMENT_INVALID_TERRAIN,
  [ErrorCode.PLACEMENT_OUT_OF_BOUNDS]:
    TranslationKey.ERROR_PLACEMENT_OUT_OF_BOUNDS,
  [ErrorCode.PLACEMENT_EXCEEDS_KINGDOM_SIZE]:
    TranslationKey.ERROR_PLACEMENT_EXCEEDS_KINGDOM_SIZE,
  [ErrorCode.NOT_YOUR_TURN]: TranslationKey.ERROR_NOT_YOUR_TURN,
  [ErrorCode.CANNOT_PICK]: TranslationKey.ERROR_CANNOT_PICK,
  [ErrorCode.CANNOT_PLACE]: TranslationKey.ERROR_CANNOT_PLACE,
  [ErrorCode.DOMINO_ALREADY_PICKED]: TranslationKey.ERROR_DOMINO_ALREADY_PICKED,
  [ErrorCode.UNDO_UNAVAILABLE]: TranslationKey.ERROR_UNDO_UNAVAILABLE,
  [ErrorCode.REDO_UNAVAILABLE]: TranslationKey.ERROR_REDO_UNAVAILABLE,
  [ErrorCode.CANNOT_PLACE_KNIGHT]: TranslationKey.ERROR_CANNOT_PLACE_KNIGHT,
  [ErrorCode.MAX_KNIGHTS_REACHED]: TranslationKey.ERROR_MAX_KNIGHTS_REACHED,
  [ErrorCode.KNIGHT_TERRITORY_OCCUPIED]:
    TranslationKey.ERROR_KNIGHT_TERRITORY_OCCUPIED,
  [ErrorCode.CANNOT_AFFORD_BUILDING]:
    TranslationKey.ERROR_CANNOT_AFFORD_BUILDING,
  [ErrorCode.NO_CONSTRUCTION_SQUARE]:
    TranslationKey.ERROR_NO_CONSTRUCTION_SQUARE,
  [ErrorCode.DRAGON_UNAVAILABLE]: TranslationKey.ERROR_DRAGON_UNAVAILABLE,
  [ErrorCode.QUEEN_HOLDER_CANNOT_USE_DRAGON]:
    TranslationKey.ERROR_QUEEN_HOLDER_CANNOT_USE_DRAGON,
  [ErrorCode.BUILDING_NOT_FOUND]: TranslationKey.ERROR_BUILDING_NOT_FOUND,
  [ErrorCode.INVALID_OPTIONAL_ACTION]:
    TranslationKey.ERROR_INVALID_OPTIONAL_ACTION,
  [ErrorCode.GIANT_POOL_EMPTY]: TranslationKey.ERROR_GIANT_POOL_EMPTY,
  [ErrorCode.GIANT_NOT_FOUND]: TranslationKey.ERROR_GIANT_NOT_FOUND,
  [ErrorCode.INVALID_GIANT_PLACEMENT]:
    TranslationKey.ERROR_INVALID_GIANT_PLACEMENT,
  [ErrorCode.NOT_AOG_MODE]: TranslationKey.ERROR_NOT_AOG_MODE,
  [ErrorCode.FIRE_TOKEN_POOL_EMPTY]: TranslationKey.ERROR_FIRE_TOKEN_POOL_EMPTY,
  [ErrorCode.FIRE_TOKEN_INVALID_POSITION]:
    TranslationKey.ERROR_FIRE_TOKEN_INVALID_POSITION,
  [ErrorCode.NO_PENDING_FIRE_TOKEN]: TranslationKey.ERROR_NO_PENDING_FIRE_TOKEN,
  [ErrorCode.CANNOT_RECRUIT_CAVEMAN]:
    TranslationKey.ERROR_CANNOT_RECRUIT_CAVEMAN,
  [ErrorCode.INSUFFICIENT_RESOURCES]:
    TranslationKey.ERROR_INSUFFICIENT_RESOURCES,
  [ErrorCode.INVALID_CAVEMAN_PLACEMENT]:
    TranslationKey.ERROR_INVALID_CAVEMAN_PLACEMENT,
  [ErrorCode.CAVEMAN_NOT_FOUND]: TranslationKey.ERROR_CAVEMAN_NOT_FOUND,
  [ErrorCode.NOT_TRIBE_MODE]: TranslationKey.ERROR_NOT_TRIBE_MODE,
};

/**
 * Translates an error code to a localized message.
 * Convenience function combining errorCodeToTranslationKey lookup and translation.
 */
export const translateErrorCode = (
  translator: Translator,
  code: ErrorCodeType,
  params?: Record<string, string | number>,
): string => {
  const key = errorCodeToTranslationKey[code];
  return translator.t(key, params);
};

/**
 * Translator interface for custom translations.
 */
export interface Translator {
  /**
   * Translate a key to the current language.
   * @param key - The translation key
   * @param params - Optional parameters for interpolation
   * @returns The translated string
   */
  t(key: TranslationKeyType, params?: Record<string, string | number>): string;
}

/**
 * Creates a translator with the provided translations.
 * Falls back to default English translations for missing keys.
 *
 * @param translations - Custom translations to use
 * @returns A translator instance
 */
export const createTranslator = (
  translations: Partial<Record<TranslationKeyType, string>> = {},
): Translator => {
  const mergedTranslations = { ...defaultTranslations, ...translations };

  return {
    t(
      key: TranslationKeyType,
      params?: Record<string, string | number>,
    ): string {
      let text = mergedTranslations[key] || key;

      // Simple parameter interpolation: {{param}}
      if (params) {
        for (const [paramKey, value] of Object.entries(params)) {
          text = text.replace(
            new RegExp(`\\{\\{${paramKey}\\}\\}`, "g"),
            String(value),
          );
        }
      }

      return text;
    },
  };
};

/**
 * Default translator using English translations.
 */
export const defaultTranslator: Translator = createTranslator();
