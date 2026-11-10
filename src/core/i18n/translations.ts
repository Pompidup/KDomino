import {
  ErrorCode,
  type ErrorCodeType,
} from "@core/domain/errors/domainErrors.js";
import type { QuestType } from "@core/domain/types/ageOfGiants.js";
import type { Ground } from "@core/domain/types/domino.js";
import type {
  CavemanKind,
  HunterGathererKind,
  ResourceType,
  WarriorType,
} from "@core/domain/types/origins.js";
import type { PlayerActions } from "@core/domain/types/player.js";

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
  ERROR_DOMINO_RESERVED: "error.dominoReserved",
  ERROR_INVALID_PLAYER_COUNT: "error.invalidPlayerCount",
  ERROR_INVALID_PLAYER_NAME: "error.invalidPlayerName",
  ERROR_EXTRA_RULE_NOT_AVAILABLE: "error.extraRuleNotAvailable",
  ERROR_UNDO_UNAVAILABLE: "error.undoUnavailable",
  ERROR_REDO_UNAVAILABLE: "error.redoUnavailable",

  // Game mode names
  MODE_CLASSIC: "mode.classic",
  MODE_QUEENDOMINO: "mode.queenDomino",
  MODE_ORIGINS_DISCOVERY: "mode.originsDiscovery",
  MODE_ORIGINS_TOTEM: "mode.originsTotem",
  MODE_ORIGINS_TRIBE: "mode.originsTribe",
  MODE_AGE_OF_GIANTS: "mode.ageOfGiants",
  MODE_AGE_OF_GIANTS_QUEENDOMINO: "mode.ageOfGiantsQueenDomino",

  // Extra rule names
  RULE_MIDDLE_KINGDOM: "rule.middleKingdom",
  RULE_HARMONY: "rule.harmony",
  RULE_MIGHTY_DUEL: "rule.mightyDuel",
  RULE_DYNASTY: "rule.dynasty",
  RULE_EMPIRE_OF_FIRE: "rule.empireOfFire",
  RULE_HOMO_HABILIS: "rule.homoHabilis",
  RULE_NEOLITHIC: "rule.neolithic",

  // Ground types
  GROUND_CASTLE: "ground.castle",
  GROUND_WHEAT: "ground.wheat",
  GROUND_FOREST: "ground.forest",
  GROUND_SEA: "ground.sea",
  GROUND_PLAIN: "ground.plain",
  GROUND_SWAMP: "ground.swamp",
  GROUND_MINE: "ground.mine",
  // Ground types (Kingdomino Origins)
  GROUND_GRASSLAND: "ground.grassland",
  GROUND_LAKE: "ground.lake",
  GROUND_JUNGLE: "ground.jungle",
  GROUND_QUARRY: "ground.quarry",
  GROUND_DESERT: "ground.desert",
  GROUND_VOLCANO: "ground.volcano",

  // Resources (Kingdomino Origins — Totem / Tribe)
  RESOURCE_MAMMOTH: "resource.mammoth",
  RESOURCE_FISH: "resource.fish",
  RESOURCE_MUSHROOM: "resource.mushroom",
  RESOURCE_FLINT: "resource.flint",

  // Cavemen (Kingdomino Origins — Tribe)
  CAVEMAN_HUNTER_GATHERER: "caveman.hunterGatherer",
  CAVEMAN_WARRIOR: "caveman.warrior",
  CAVEMAN_MAMMOTH_HUNTER: "caveman.mammothHunter",
  CAVEMAN_FISHERMAN: "caveman.fisherman",
  CAVEMAN_MUSHROOM_PICKER: "caveman.mushroomPicker",
  CAVEMAN_FLINT_COLLECTOR: "caveman.flintCollector",
  CAVEMAN_TRAPPER: "caveman.trapper",
  CAVEMAN_GATHERER: "caveman.gatherer",
  CAVEMAN_FIRE_LADY: "caveman.fireLady",
  CAVEMAN_WARRIOR_SMALL: "caveman.warriorSmall",
  CAVEMAN_WARRIOR_AMAZON: "caveman.warriorAmazon",
  CAVEMAN_WARRIOR_OAFISH: "caveman.warriorOafish",

  // Game phases
  PHASE_ADD_PLAYERS: "phase.addPlayers",
  PHASE_OPTIONS: "phase.options",
  PHASE_START: "phase.start",
  PHASE_RESULT: "phase.result",

  // Actions
  ACTION_PICK_DOMINO: "action.pickDomino",
  ACTION_PLACE_DOMINO: "action.placeDomino",
  ACTION_PASS: "action.pass",
  ACTION_PLACE_KNIGHT: "action.placeKnight",
  ACTION_CONSTRUCT_BUILDING: "action.constructBuilding",
  ACTION_USE_DRAGON: "action.useDragon",
  ACTION_SKIP_OPTIONAL_ACTION: "action.skipOptionalAction",
  ACTION_PLACE_GIANT: "action.placeGiant",
  ACTION_SEND_GIANT: "action.sendGiant",
  ACTION_PLACE_FIRE_TOKEN: "action.placeFireToken",
  ACTION_RECRUIT_CAVEMAN: "action.recruitCaveman",

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
  ERROR_INVALID_PLAYER_ID: "error.invalidPlayerId",

  // Score breakdown labels (extra rules reuse the RULE_* keys,
  // hunter-gatherers reuse the CAVEMAN_* keys)
  SCORE_QUEEN: "score.queen",
  SCORE_BUILDING: "score.building",
  SCORE_WEALTH: "score.wealth",
  SCORE_TOTEM_MAMMOTH: "score.totemMammoth",
  SCORE_TOTEM_FISH: "score.totemFish",
  SCORE_TOTEM_MUSHROOM: "score.totemMushroom",
  SCORE_TOTEM_FLINT: "score.totemFlint",
  SCORE_RESOURCES: "score.resources",
  SCORE_WARRIORS: "score.warriors",
  SCORE_FIRE: "score.fire",
  QUEST_LOCAL_TRADE: "quest.localTrade",
  QUEST_KINGDOM_BORDERS: "quest.kingdomBorders",
  QUEST_HARMONY: "quest.harmony",
  QUEST_MIDDLE_KINGDOM: "quest.middleKingdom",
  QUEST_LOST_CORNER: "quest.lostCorner",
  QUEST_MEGALOMANIA: "quest.megalomania",
  QUEST_AUSTERE_KING: "quest.austereKing",
} as const;

export type TranslationKeyType =
  (typeof TranslationKey)[keyof typeof TranslationKey];

/**
 * Default English translations.
 * Also available as `englishTranslations` / `translations.en`.
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
  [TranslationKey.ERROR_DOMINO_RESERVED]:
    "This domino is reserved for the other player (Neolithic: pairs 1 & 4 and 2 & 3)",
  [TranslationKey.ERROR_INVALID_PLAYER_COUNT]:
    "Invalid number of players (1-4 required)",
  [TranslationKey.ERROR_INVALID_PLAYER_NAME]:
    "Player name must be at least 3 characters",
  [TranslationKey.ERROR_EXTRA_RULE_NOT_AVAILABLE]:
    "Extra rule is not available for this game mode or number of players",
  [TranslationKey.ERROR_UNDO_UNAVAILABLE]: "No state to undo",
  [TranslationKey.ERROR_REDO_UNAVAILABLE]: "No state to redo",

  // Game mode names
  [TranslationKey.MODE_CLASSIC]: "Classic",
  [TranslationKey.MODE_QUEENDOMINO]: "Queendomino",
  [TranslationKey.MODE_ORIGINS_DISCOVERY]: "Kingdomino Origins — Discovery",
  [TranslationKey.MODE_ORIGINS_TOTEM]: "Kingdomino Origins — Totem",
  [TranslationKey.MODE_ORIGINS_TRIBE]: "Kingdomino Origins — Tribe",
  [TranslationKey.MODE_AGE_OF_GIANTS]: "Age of Giants",
  [TranslationKey.MODE_AGE_OF_GIANTS_QUEENDOMINO]:
    "Age of Giants — Queendomino",

  // Extra rule names
  [TranslationKey.RULE_MIDDLE_KINGDOM]: "The Middle Kingdom",
  [TranslationKey.RULE_HARMONY]: "Harmony",
  [TranslationKey.RULE_MIGHTY_DUEL]: "The Mighty Duel",
  [TranslationKey.RULE_DYNASTY]: "Dynasty",
  [TranslationKey.RULE_EMPIRE_OF_FIRE]: "Empire of Fire",
  [TranslationKey.RULE_HOMO_HABILIS]: "Homo Habilis",
  [TranslationKey.RULE_NEOLITHIC]: "Neolithic",

  // Ground types
  [TranslationKey.GROUND_CASTLE]: "Castle",
  [TranslationKey.GROUND_WHEAT]: "Wheat Field",
  [TranslationKey.GROUND_FOREST]: "Forest",
  [TranslationKey.GROUND_SEA]: "Sea",
  [TranslationKey.GROUND_PLAIN]: "Plain",
  [TranslationKey.GROUND_SWAMP]: "Swamp",
  [TranslationKey.GROUND_MINE]: "Mine",
  [TranslationKey.GROUND_GRASSLAND]: "Grassland",
  [TranslationKey.GROUND_LAKE]: "Lake",
  [TranslationKey.GROUND_JUNGLE]: "Jungle",
  [TranslationKey.GROUND_QUARRY]: "Quarry",
  [TranslationKey.GROUND_DESERT]: "Desert",
  [TranslationKey.GROUND_VOLCANO]: "Volcano",

  // Resources
  [TranslationKey.RESOURCE_MAMMOTH]: "Mammoth",
  [TranslationKey.RESOURCE_FISH]: "Fish",
  [TranslationKey.RESOURCE_MUSHROOM]: "Mushroom",
  [TranslationKey.RESOURCE_FLINT]: "Flint",

  // Cavemen
  [TranslationKey.CAVEMAN_HUNTER_GATHERER]: "Hunter-gatherer",
  [TranslationKey.CAVEMAN_WARRIOR]: "Warrior",
  [TranslationKey.CAVEMAN_MAMMOTH_HUNTER]: "Mammoth Hunter",
  [TranslationKey.CAVEMAN_FISHERMAN]: "Fisherman",
  [TranslationKey.CAVEMAN_MUSHROOM_PICKER]: "Mushroom Picker",
  [TranslationKey.CAVEMAN_FLINT_COLLECTOR]: "Flint Collector",
  [TranslationKey.CAVEMAN_TRAPPER]: "Trapper",
  [TranslationKey.CAVEMAN_GATHERER]: "Gatherer",
  [TranslationKey.CAVEMAN_FIRE_LADY]: "Fire Lady",
  [TranslationKey.CAVEMAN_WARRIOR_SMALL]: "Small Warrior",
  [TranslationKey.CAVEMAN_WARRIOR_AMAZON]: "Amazon",
  [TranslationKey.CAVEMAN_WARRIOR_OAFISH]: "Oafish Warrior",

  // Game phases
  [TranslationKey.PHASE_ADD_PLAYERS]: "Add Players",
  [TranslationKey.PHASE_OPTIONS]: "Game Options",
  [TranslationKey.PHASE_START]: "Start Game",
  [TranslationKey.PHASE_RESULT]: "Game Results",

  // Actions
  [TranslationKey.ACTION_PICK_DOMINO]: "Pick Domino",
  [TranslationKey.ACTION_PLACE_DOMINO]: "Place Domino",
  [TranslationKey.ACTION_PASS]: "Pass",
  [TranslationKey.ACTION_PLACE_KNIGHT]: "Place Knight",
  [TranslationKey.ACTION_CONSTRUCT_BUILDING]: "Construct Building",
  [TranslationKey.ACTION_USE_DRAGON]: "Use the Dragon",
  [TranslationKey.ACTION_SKIP_OPTIONAL_ACTION]: "Skip",
  [TranslationKey.ACTION_PLACE_GIANT]: "Place Giant",
  [TranslationKey.ACTION_SEND_GIANT]: "Send Giant",
  [TranslationKey.ACTION_PLACE_FIRE_TOKEN]: "Place Fire Token",
  [TranslationKey.ACTION_RECRUIT_CAVEMAN]: "Recruit Caveman",

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
  [TranslationKey.ERROR_INVALID_PLAYER_ID]:
    "Player ids must be non-empty and unique",

  // Score breakdown labels
  [TranslationKey.SCORE_QUEEN]: "Queen",
  [TranslationKey.SCORE_BUILDING]: "Building: {{name}}",
  [TranslationKey.SCORE_WEALTH]: "Wealth",
  [TranslationKey.SCORE_TOTEM_MAMMOTH]: "Mammoth totem",
  [TranslationKey.SCORE_TOTEM_FISH]: "Fish totem",
  [TranslationKey.SCORE_TOTEM_MUSHROOM]: "Mushroom totem",
  [TranslationKey.SCORE_TOTEM_FLINT]: "Flint totem",
  [TranslationKey.SCORE_RESOURCES]: "Resources",
  [TranslationKey.SCORE_WARRIORS]: "Warrior groups",
  [TranslationKey.SCORE_FIRE]: "Fire tokens",
  [TranslationKey.QUEST_LOCAL_TRADE]: "Local Trade",
  [TranslationKey.QUEST_KINGDOM_BORDERS]: "Kingdom Borders",
  [TranslationKey.QUEST_HARMONY]: "Harmony",
  [TranslationKey.QUEST_MIDDLE_KINGDOM]: "Middle Kingdom",
  [TranslationKey.QUEST_LOST_CORNER]: "Lost Corner",
  [TranslationKey.QUEST_MEGALOMANIA]: "Megalomania",
  [TranslationKey.QUEST_AUSTERE_KING]: "Austere King",
};

/** English translations (alias of `defaultTranslations`). */
export const englishTranslations: Record<TranslationKeyType, string> =
  defaultTranslations;

/**
 * French translations.
 */
export const frenchTranslations: Record<TranslationKeyType, string> = {
  // Error messages
  [TranslationKey.ERROR_INVALID_STEP]: "Étape de jeu invalide",
  [TranslationKey.ERROR_STEP_EXECUTION_FAILED]:
    "L'exécution de l'étape a échoué",
  [TranslationKey.ERROR_ACTION_EXECUTION_FAILED]:
    "L'exécution de l'action a échoué",
  [TranslationKey.ERROR_LORD_NOT_FOUND]: "Seigneur introuvable",
  [TranslationKey.ERROR_PLAYER_NOT_FOUND]: "Joueur introuvable",
  [TranslationKey.ERROR_DOMINO_NOT_FOUND]: "Domino introuvable",
  [TranslationKey.ERROR_MODE_NOT_FOUND]: "Mode de jeu introuvable",
  [TranslationKey.ERROR_INVALID_PLACEMENT]: "Placement invalide",
  [TranslationKey.ERROR_PLACEMENT_NOT_EMPTY]: "Cette position n'est pas libre",
  [TranslationKey.ERROR_PLACEMENT_NOT_ADJACENT]:
    "Le domino n'est adjacent à aucune tuile existante",
  [TranslationKey.ERROR_PLACEMENT_INVALID_TERRAIN]:
    "Le type de terrain ne correspond pas",
  [TranslationKey.ERROR_PLACEMENT_OUT_OF_BOUNDS]: "Placement hors des limites",
  [TranslationKey.ERROR_PLACEMENT_EXCEEDS_KINGDOM_SIZE]:
    "Le placement dépasse la taille du royaume",
  [TranslationKey.ERROR_NOT_YOUR_TURN]: "Ce n'est pas votre tour",
  [TranslationKey.ERROR_CANNOT_PICK]:
    "Impossible de choisir un domino maintenant",
  [TranslationKey.ERROR_CANNOT_PLACE]:
    "Impossible de placer un domino maintenant",
  [TranslationKey.ERROR_DOMINO_ALREADY_PICKED]: "Ce domino a déjà été choisi",
  [TranslationKey.ERROR_DOMINO_RESERVED]:
    "Ce domino est réservé à l'autre joueur (Néolithique : paires 1 et 4, 2 et 3)",
  [TranslationKey.ERROR_INVALID_PLAYER_COUNT]:
    "Nombre de joueurs invalide (1 à 4 requis)",
  [TranslationKey.ERROR_INVALID_PLAYER_NAME]:
    "Le nom du joueur doit contenir au moins 3 caractères",
  [TranslationKey.ERROR_EXTRA_RULE_NOT_AVAILABLE]:
    "Cette règle optionnelle n'est pas disponible pour ce mode ou ce nombre de joueurs",
  [TranslationKey.ERROR_UNDO_UNAVAILABLE]: "Aucun état à annuler",
  [TranslationKey.ERROR_REDO_UNAVAILABLE]: "Aucun état à rétablir",

  // Game mode names
  [TranslationKey.MODE_CLASSIC]: "Classique",
  [TranslationKey.MODE_QUEENDOMINO]: "Queendomino",
  [TranslationKey.MODE_ORIGINS_DISCOVERY]: "Kingdomino Origins — Découverte",
  [TranslationKey.MODE_ORIGINS_TOTEM]: "Kingdomino Origins — Totem",
  [TranslationKey.MODE_ORIGINS_TRIBE]: "Kingdomino Origins — Tribu",
  [TranslationKey.MODE_AGE_OF_GIANTS]: "L'Âge des Géants",
  [TranslationKey.MODE_AGE_OF_GIANTS_QUEENDOMINO]:
    "L'Âge des Géants — Queendomino",

  // Extra rule names
  [TranslationKey.RULE_MIDDLE_KINGDOM]: "L'Empire du Milieu",
  [TranslationKey.RULE_HARMONY]: "Harmonie",
  [TranslationKey.RULE_MIGHTY_DUEL]: "Le Grand Duel",
  [TranslationKey.RULE_DYNASTY]: "Dynastie",
  [TranslationKey.RULE_EMPIRE_OF_FIRE]: "L'Empire du Feu",
  [TranslationKey.RULE_HOMO_HABILIS]: "Homo Habilis",
  [TranslationKey.RULE_NEOLITHIC]: "Néolithique",

  // Ground types
  [TranslationKey.GROUND_CASTLE]: "Château",
  [TranslationKey.GROUND_WHEAT]: "Champ de blé",
  [TranslationKey.GROUND_FOREST]: "Forêt",
  [TranslationKey.GROUND_SEA]: "Mer",
  [TranslationKey.GROUND_PLAIN]: "Prairie",
  [TranslationKey.GROUND_SWAMP]: "Marécage",
  [TranslationKey.GROUND_MINE]: "Mine",
  [TranslationKey.GROUND_GRASSLAND]: "Steppe",
  [TranslationKey.GROUND_LAKE]: "Lac",
  [TranslationKey.GROUND_JUNGLE]: "Jungle",
  [TranslationKey.GROUND_QUARRY]: "Carrière",
  [TranslationKey.GROUND_DESERT]: "Désert",
  [TranslationKey.GROUND_VOLCANO]: "Volcan",

  // Resources
  [TranslationKey.RESOURCE_MAMMOTH]: "Mammouth",
  [TranslationKey.RESOURCE_FISH]: "Poisson",
  [TranslationKey.RESOURCE_MUSHROOM]: "Champignon",
  [TranslationKey.RESOURCE_FLINT]: "Silex",

  // Cavemen
  [TranslationKey.CAVEMAN_HUNTER_GATHERER]: "Chasseur-cueilleur",
  [TranslationKey.CAVEMAN_WARRIOR]: "Guerrier",
  [TranslationKey.CAVEMAN_MAMMOTH_HUNTER]: "Chasseur de mammouths",
  [TranslationKey.CAVEMAN_FISHERMAN]: "Pêcheur",
  [TranslationKey.CAVEMAN_MUSHROOM_PICKER]: "Cueilleur de champignons",
  [TranslationKey.CAVEMAN_FLINT_COLLECTOR]: "Tailleur de silex",
  [TranslationKey.CAVEMAN_TRAPPER]: "Trappeur",
  [TranslationKey.CAVEMAN_GATHERER]: "Cueilleur",
  [TranslationKey.CAVEMAN_FIRE_LADY]: "Dame du Feu",
  [TranslationKey.CAVEMAN_WARRIOR_SMALL]: "Petit guerrier",
  [TranslationKey.CAVEMAN_WARRIOR_AMAZON]: "Amazone",
  [TranslationKey.CAVEMAN_WARRIOR_OAFISH]: "Gros balourd",

  // Game phases
  [TranslationKey.PHASE_ADD_PLAYERS]: "Ajout des joueurs",
  [TranslationKey.PHASE_OPTIONS]: "Options de jeu",
  [TranslationKey.PHASE_START]: "Début de la partie",
  [TranslationKey.PHASE_RESULT]: "Résultats",

  // Actions
  [TranslationKey.ACTION_PICK_DOMINO]: "Choisir un domino",
  [TranslationKey.ACTION_PLACE_DOMINO]: "Placer le domino",
  [TranslationKey.ACTION_PASS]: "Passer",
  [TranslationKey.ACTION_PLACE_KNIGHT]: "Placer un chevalier",
  [TranslationKey.ACTION_CONSTRUCT_BUILDING]: "Construire un bâtiment",
  [TranslationKey.ACTION_USE_DRAGON]: "Utiliser le Dragon",
  [TranslationKey.ACTION_SKIP_OPTIONAL_ACTION]: "Passer l'action",
  [TranslationKey.ACTION_PLACE_GIANT]: "Placer un géant",
  [TranslationKey.ACTION_SEND_GIANT]: "Envoyer un géant",
  [TranslationKey.ACTION_PLACE_FIRE_TOKEN]: "Placer un jeton feu",
  [TranslationKey.ACTION_RECRUIT_CAVEMAN]: "Recruter un homme préhistorique",

  // Queendomino errors
  [TranslationKey.ERROR_CANNOT_PLACE_KNIGHT]:
    "Impossible de placer un chevalier ici",
  [TranslationKey.ERROR_MAX_KNIGHTS_REACHED]:
    "Nombre maximal de chevaliers atteint (3)",
  [TranslationKey.ERROR_KNIGHT_TERRITORY_OCCUPIED]:
    "Ce territoire a déjà un chevalier",
  [TranslationKey.ERROR_CANNOT_AFFORD_BUILDING]:
    "Pas assez de pièces pour acheter ce bâtiment",
  [TranslationKey.ERROR_NO_CONSTRUCTION_SQUARE]:
    "Aucune case de construction libre disponible",
  [TranslationKey.ERROR_DRAGON_UNAVAILABLE]:
    "Le Dragon n'est pas disponible ce tour-ci",
  [TranslationKey.ERROR_QUEEN_HOLDER_CANNOT_USE_DRAGON]:
    "Le détenteur de la Reine ne peut pas utiliser le Dragon",
  [TranslationKey.ERROR_BUILDING_NOT_FOUND]:
    "Bâtiment introuvable sur le plateau des bâtisseurs",
  [TranslationKey.ERROR_INVALID_OPTIONAL_ACTION]:
    "Action optionnelle invalide pour cet état de jeu",

  // Age of Giants errors
  [TranslationKey.ERROR_GIANT_POOL_EMPTY]:
    "Il ne reste plus de géant en réserve",
  [TranslationKey.ERROR_GIANT_NOT_FOUND]: "Géant introuvable dans le royaume",
  [TranslationKey.ERROR_INVALID_GIANT_PLACEMENT]:
    "Position invalide pour le géant — elle doit être une couronne non couverte",
  [TranslationKey.ERROR_NOT_AOG_MODE]:
    "Le mode L'Âge des Géants n'est pas activé",

  // Origins errors
  [TranslationKey.ERROR_FIRE_TOKEN_POOL_EMPTY]:
    "Il ne reste plus de jeton feu en réserve",
  [TranslationKey.ERROR_FIRE_TOKEN_INVALID_POSITION]:
    "Position invalide pour le jeton feu",
  [TranslationKey.ERROR_NO_PENDING_FIRE_TOKEN]: "Aucun jeton feu à placer",
  [TranslationKey.ERROR_CANNOT_RECRUIT_CAVEMAN]:
    "Impossible de recruter un homme préhistorique",
  [TranslationKey.ERROR_INSUFFICIENT_RESOURCES]:
    "Ressources insuffisantes pour cette action",
  [TranslationKey.ERROR_INVALID_CAVEMAN_PLACEMENT]:
    "Position invalide pour l'homme préhistorique",
  [TranslationKey.ERROR_CAVEMAN_NOT_FOUND]: "Homme préhistorique introuvable",
  [TranslationKey.ERROR_NOT_TRIBE_MODE]: "Le mode Tribu n'est pas activé",
  [TranslationKey.ERROR_INVALID_PLAYER_ID]:
    "Les identifiants des joueurs doivent être non vides et uniques",

  // Score breakdown labels
  [TranslationKey.SCORE_QUEEN]: "Reine",
  [TranslationKey.SCORE_BUILDING]: "Bâtiment : {{name}}",
  [TranslationKey.SCORE_WEALTH]: "Richesse",
  [TranslationKey.SCORE_TOTEM_MAMMOTH]: "Totem mammouth",
  [TranslationKey.SCORE_TOTEM_FISH]: "Totem poisson",
  [TranslationKey.SCORE_TOTEM_MUSHROOM]: "Totem champignon",
  [TranslationKey.SCORE_TOTEM_FLINT]: "Totem silex",
  [TranslationKey.SCORE_RESOURCES]: "Ressources",
  [TranslationKey.SCORE_WARRIORS]: "Groupes de guerriers",
  [TranslationKey.SCORE_FIRE]: "Jetons feu",
  [TranslationKey.QUEST_LOCAL_TRADE]: "Commerce local",
  [TranslationKey.QUEST_KINGDOM_BORDERS]: "Frontières du royaume",
  [TranslationKey.QUEST_HARMONY]: "Harmonie",
  [TranslationKey.QUEST_MIDDLE_KINGDOM]: "Empire du Milieu",
  [TranslationKey.QUEST_LOST_CORNER]: "Coin perdu",
  [TranslationKey.QUEST_MEGALOMANIA]: "Mégalomanie",
  [TranslationKey.QUEST_AUSTERE_KING]: "Roi austère",
};

/** Locales shipped with the engine. */
export const supportedLocales = ["en", "fr"] as const;

/** A locale shipped with the engine. */
export type SupportedLocale = (typeof supportedLocales)[number];

/**
 * Built-in translation dictionaries, indexed by locale.
 * Every dictionary contains every `TranslationKey`.
 *
 * @example
 * ```typescript
 * const translator = createTranslator(localeTranslations.fr);
 * ```
 */
export const localeTranslations: Record<
  SupportedLocale,
  Record<TranslationKeyType, string>
> = {
  en: englishTranslations,
  fr: frenchTranslations,
};

/**
 * Maps every terrain type (`Ground`) to its translation key.
 */
export const groundToTranslationKey: Record<Ground, TranslationKeyType> = {
  castle: TranslationKey.GROUND_CASTLE,
  wheat: TranslationKey.GROUND_WHEAT,
  forest: TranslationKey.GROUND_FOREST,
  sea: TranslationKey.GROUND_SEA,
  plain: TranslationKey.GROUND_PLAIN,
  swamp: TranslationKey.GROUND_SWAMP,
  mine: TranslationKey.GROUND_MINE,
  grassland: TranslationKey.GROUND_GRASSLAND,
  lake: TranslationKey.GROUND_LAKE,
  jungle: TranslationKey.GROUND_JUNGLE,
  quarry: TranslationKey.GROUND_QUARRY,
  desert: TranslationKey.GROUND_DESERT,
  volcano: TranslationKey.GROUND_VOLCANO,
};

/**
 * Maps every player action (`PlayerActions`) to its translation key.
 */
export const playerActionToTranslationKey: Record<
  PlayerActions,
  TranslationKeyType
> = {
  pickDomino: TranslationKey.ACTION_PICK_DOMINO,
  placeDomino: TranslationKey.ACTION_PLACE_DOMINO,
  pass: TranslationKey.ACTION_PASS,
  placeKnight: TranslationKey.ACTION_PLACE_KNIGHT,
  constructBuilding: TranslationKey.ACTION_CONSTRUCT_BUILDING,
  useDragon: TranslationKey.ACTION_USE_DRAGON,
  skipOptionalAction: TranslationKey.ACTION_SKIP_OPTIONAL_ACTION,
  placeGiant: TranslationKey.ACTION_PLACE_GIANT,
  sendGiant: TranslationKey.ACTION_SEND_GIANT,
  placeFireToken: TranslationKey.ACTION_PLACE_FIRE_TOKEN,
  recruitCaveman: TranslationKey.ACTION_RECRUIT_CAVEMAN,
};

/**
 * Maps every Origins resource type to its translation key.
 */
export const resourceToTranslationKey: Record<
  ResourceType,
  TranslationKeyType
> = {
  mammoth: TranslationKey.RESOURCE_MAMMOTH,
  fish: TranslationKey.RESOURCE_FISH,
  mushroom: TranslationKey.RESOURCE_MUSHROOM,
  flint: TranslationKey.RESOURCE_FLINT,
};

/**
 * Maps every caveman tile kind (`CavemanKind`) to its translation key.
 */
export const cavemanKindToTranslationKey: Record<
  CavemanKind,
  TranslationKeyType
> = {
  hunterGatherer: TranslationKey.CAVEMAN_HUNTER_GATHERER,
  warrior: TranslationKey.CAVEMAN_WARRIOR,
};

/**
 * Maps every hunter-gatherer type to its translation key.
 */
export const hunterGathererKindToTranslationKey: Record<
  HunterGathererKind,
  TranslationKeyType
> = {
  mammothHunter: TranslationKey.CAVEMAN_MAMMOTH_HUNTER,
  fisherman: TranslationKey.CAVEMAN_FISHERMAN,
  mushroomPicker: TranslationKey.CAVEMAN_MUSHROOM_PICKER,
  flintCollector: TranslationKey.CAVEMAN_FLINT_COLLECTOR,
  trapper: TranslationKey.CAVEMAN_TRAPPER,
  gatherer: TranslationKey.CAVEMAN_GATHERER,
  fireLady: TranslationKey.CAVEMAN_FIRE_LADY,
};

/**
 * Maps every warrior type to its translation key.
 */
export const warriorTypeToTranslationKey: Record<
  WarriorType,
  TranslationKeyType
> = {
  small: TranslationKey.CAVEMAN_WARRIOR_SMALL,
  amazon: TranslationKey.CAVEMAN_WARRIOR_AMAZON,
  oafish: TranslationKey.CAVEMAN_WARRIOR_OAFISH,
};

/**
 * Maps game mode names (`GameMode["name"]`, as returned by `getModes`)
 * to their translation key.
 */
export const modeNameToTranslationKey: Readonly<
  Record<string, TranslationKeyType>
> = {
  Classic: TranslationKey.MODE_CLASSIC,
  QueenDomino: TranslationKey.MODE_QUEENDOMINO,
  "KingdominoOrigins-Discovery": TranslationKey.MODE_ORIGINS_DISCOVERY,
  "KingdominoOrigins-Totem": TranslationKey.MODE_ORIGINS_TOTEM,
  "KingdominoOrigins-Tribe": TranslationKey.MODE_ORIGINS_TRIBE,
  AgeOfGiants: TranslationKey.MODE_AGE_OF_GIANTS,
  "AgeOfGiants-QueenDomino": TranslationKey.MODE_AGE_OF_GIANTS_QUEENDOMINO,
};

/**
 * Maps extra rule names (`ExtraRule["name"]`, as returned by `getExtraRules`)
 * to their translation key.
 */
export const extraRuleNameToTranslationKey: Readonly<
  Record<string, TranslationKeyType>
> = {
  "The middle Kingdom": TranslationKey.RULE_MIDDLE_KINGDOM,
  Harmony: TranslationKey.RULE_HARMONY,
  "The Mighty Duel": TranslationKey.RULE_MIGHTY_DUEL,
  Dynasty: TranslationKey.RULE_DYNASTY,
  "Empire of Fire": TranslationKey.RULE_EMPIRE_OF_FIRE,
  "Homo Habilis": TranslationKey.RULE_HOMO_HABILIS,
  Neolithic: TranslationKey.RULE_NEOLITHIC,
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
  [ErrorCode.EXTRA_RULE_NOT_AVAILABLE]:
    TranslationKey.ERROR_EXTRA_RULE_NOT_AVAILABLE,
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
  [ErrorCode.DOMINO_RESERVED]: TranslationKey.ERROR_DOMINO_RESERVED,
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
  [ErrorCode.INVALID_PLAYER_ID]: TranslationKey.ERROR_INVALID_PLAYER_ID,
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

/**
 * Maps every Age of Giants quest type to the translation key of its name
 * (used as `label` of `quest` score bonuses).
 */
export const questTypeToTranslationKey: Record<QuestType, TranslationKeyType> =
  {
    localTrade: TranslationKey.QUEST_LOCAL_TRADE,
    kingdomBorders: TranslationKey.QUEST_KINGDOM_BORDERS,
    harmony: TranslationKey.QUEST_HARMONY,
    middleKingdom: TranslationKey.QUEST_MIDDLE_KINGDOM,
    lostCorner: TranslationKey.QUEST_LOST_CORNER,
    megalomania: TranslationKey.QUEST_MEGALOMANIA,
    austereKing: TranslationKey.QUEST_AUSTERE_KING,
  };

/**
 * Maps every Origins totem (by resource type) to the translation key of its
 * name (used as `label` of `totem` score bonuses).
 */
export const totemToTranslationKey: Record<ResourceType, TranslationKeyType> = {
  mammoth: TranslationKey.SCORE_TOTEM_MAMMOTH,
  fish: TranslationKey.SCORE_TOTEM_FISH,
  mushroom: TranslationKey.SCORE_TOTEM_MUSHROOM,
  flint: TranslationKey.SCORE_TOTEM_FLINT,
};
