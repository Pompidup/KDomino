/**
 * Translation keys for internationalization support.
 * Use these keys instead of hardcoded strings for translatable content.
 */
export const TranslationKey = {
  // Error messages
  ERROR_INVALID_STEP: "error.invalidStep",
  ERROR_LORD_NOT_FOUND: "error.lordNotFound",
  ERROR_PLAYER_NOT_FOUND: "error.playerNotFound",
  ERROR_DOMINO_NOT_FOUND: "error.dominoNotFound",
  ERROR_INVALID_PLACEMENT: "error.invalidPlacement",
  ERROR_PLACEMENT_NOT_EMPTY: "error.placementNotEmpty",
  ERROR_PLACEMENT_NOT_ADJACENT: "error.placementNotAdjacent",
  ERROR_PLACEMENT_INVALID_TERRAIN: "error.placementInvalidTerrain",
  ERROR_PLACEMENT_OUT_OF_BOUNDS: "error.placementOutOfBounds",
  ERROR_NOT_YOUR_TURN: "error.notYourTurn",
  ERROR_CANNOT_PICK: "error.cannotPick",
  ERROR_CANNOT_PLACE: "error.cannotPlace",
  ERROR_DOMINO_ALREADY_PICKED: "error.dominoAlreadyPicked",
  ERROR_INVALID_PLAYER_COUNT: "error.invalidPlayerCount",
  ERROR_INVALID_PLAYER_NAME: "error.invalidPlayerName",

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
} as const;

export type TranslationKeyType =
  (typeof TranslationKey)[keyof typeof TranslationKey];

/**
 * Default English translations.
 */
export const defaultTranslations: Record<TranslationKeyType, string> = {
  // Error messages
  [TranslationKey.ERROR_INVALID_STEP]: "Invalid game step",
  [TranslationKey.ERROR_LORD_NOT_FOUND]: "Lord not found",
  [TranslationKey.ERROR_PLAYER_NOT_FOUND]: "Player not found",
  [TranslationKey.ERROR_DOMINO_NOT_FOUND]: "Domino not found",
  [TranslationKey.ERROR_INVALID_PLACEMENT]: "Invalid placement",
  [TranslationKey.ERROR_PLACEMENT_NOT_EMPTY]: "Position is not empty",
  [TranslationKey.ERROR_PLACEMENT_NOT_ADJACENT]: "Not adjacent to existing tiles",
  [TranslationKey.ERROR_PLACEMENT_INVALID_TERRAIN]: "Terrain type does not match",
  [TranslationKey.ERROR_PLACEMENT_OUT_OF_BOUNDS]: "Placement is out of bounds",
  [TranslationKey.ERROR_NOT_YOUR_TURN]: "It is not your turn",
  [TranslationKey.ERROR_CANNOT_PICK]: "Cannot pick a domino now",
  [TranslationKey.ERROR_CANNOT_PLACE]: "Cannot place a domino now",
  [TranslationKey.ERROR_DOMINO_ALREADY_PICKED]: "Domino has already been picked",
  [TranslationKey.ERROR_INVALID_PLAYER_COUNT]: "Invalid number of players (2-4 required)",
  [TranslationKey.ERROR_INVALID_PLAYER_NAME]: "Player name must be at least 3 characters",

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
  translations: Partial<Record<TranslationKeyType, string>> = {}
): Translator => {
  const mergedTranslations = { ...defaultTranslations, ...translations };

  return {
    t(key: TranslationKeyType, params?: Record<string, string | number>): string {
      let text = mergedTranslations[key] || key;

      // Simple parameter interpolation: {{param}}
      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          text = text.replace(new RegExp(`{{${paramKey}}}`, "g"), String(value));
        });
      }

      return text;
    },
  };
};

/**
 * Default translator using English translations.
 */
export const defaultTranslator = createTranslator();
