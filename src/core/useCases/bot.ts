import { isGameWithNextAction } from "@core/domain/types/game.js";
import type {
  Domino,
  Game,
  GameState,
  GameWithNextAction,
  Kingdom,
  Player,
  Position,
  RevealsDomino,
} from "@core/domain/types/index.js";
import type { GameEngine } from "@core/portUserside/engine.js";
import {
  type BuildingChoice,
  type BuildingContext,
  bestBuilding,
  bestCavemanRecruitment,
  bestFireTokenPosition,
  bestGiantPosition,
  bestGiantToSend,
  bestKnightPosition,
  buildingContext,
  type CavemanChoice,
  type CavemanContext,
  cavemanContext,
  createPlayerEvaluator,
  type DragonContext,
  decisionRandom,
  dragonContext,
  type EvaluationProfile,
  type FireTokenContext,
  fireTokenContext,
  type GiantPositionContext,
  giantPositionContext,
  type KnightContext,
  knightContext,
  type PlayerEvaluator,
  randomChoice,
  randomItem,
  type SendGiantChoice,
  type SendGiantContext,
  sendGiantContext,
  simulateDominoPlacement,
} from "./botExtensions.js";
import { getStrategy } from "./botRegistry.js";
import type { ValidPlacement } from "./getValidPlacements.js";
import { getValidPlacementsUseCase } from "./getValidPlacements.js";

export type {
  BuildingChoice,
  BuildingContext,
  CavemanChoice,
  CavemanContext,
  DragonContext,
  EvaluationProfile,
  ExtensionContext,
  FireTokenContext,
  GiantPositionContext,
  KnightContext,
  SendGiantChoice,
  SendGiantContext,
} from "./botExtensions.js";

// ─── Types ───────────────────────────────────────────────────────────

/**
 * Context provided to a bot strategy when choosing a domino to pick.
 */
export type PickContext = {
  game: GameWithNextAction;
  lordId: string;
  availableDominoes: RevealsDomino[];
};

/**
 * Context provided to a bot strategy when choosing where to place a domino.
 */
export type PlaceContext = {
  game: GameWithNextAction;
  lordId: string;
  domino: Domino;
  kingdom: Kingdom;
  validPlacements: ValidPlacement[];
};

/**
 * A bot strategy that decides which domino to pick and where to place it,
 * and optionally how to play the extension actions (Queendomino, Origins,
 * Age of Giants). Strategies are stateless — all information comes from the
 * context.
 *
 * Every extension method is optional: when a strategy does not define one,
 * `playBotTurn` uses the choice of `greedyStrategy` (best immediate
 * mode-aware score). An extension method is only called when the action has
 * at least one valid target, and every target of its context is accepted by
 * the action. Returning `null` skips the action (for the mandatory
 * `placeGiant`, `null` falls back to the greedy choice).
 */
export type BotStrategy = {
  chooseDomino: (context: PickContext) => number;
  choosePlacement: (context: PlaceContext) => ValidPlacement | null;
  /** `placeKnight` (Queendomino): a square, or null to skip */
  chooseKnightPosition?: (context: KnightContext) => Position | null;
  /** `constructBuilding` (Queendomino): a building and square, or null */
  chooseBuilding?: (context: BuildingContext) => BuildingChoice | null;
  /** `useDragon` (Queendomino): id of the building to burn, or null */
  chooseDragonTarget?: (context: DragonContext) => number | null;
  /** `placeFireToken` (Origins): a square, or null to skip */
  chooseFireTokenPosition?: (context: FireTokenContext) => Position | null;
  /** `recruitCaveman` (Origins Tribe): a recruitment, or null to skip */
  chooseCavemanRecruitment?: (context: CavemanContext) => CavemanChoice | null;
  /** `placeGiant` (Age of Giants, mandatory): the crown to cover */
  chooseGiantPosition?: (context: GiantPositionContext) => Position | null;
  /** `sendGiant` (Age of Giants): a giant and its target, or null to skip */
  chooseGiantToSend?: (context: SendGiantContext) => SendGiantChoice | null;
};

/** The extension-action methods of a strategy. */
export type BotExtensionChoices = Required<
  Omit<BotStrategy, "chooseDomino" | "choosePlacement">
>;

// ─── Helpers ─────────────────────────────────────────────────────────

/** Search state shared by the domino decisions of one strategy call. */
type Search = {
  game: Game;
  evaluate: PlayerEvaluator;
  maxSize: number;
};

const getLordAndPlayer = (game: GameWithNextAction, lordId: string) => {
  const lord = game.lords.find((l) => l.id === lordId);
  const player = lord
    ? game.players.find((p) => p.id === lord.playerId)
    : undefined;
  return { lord, player };
};

const createSearch = (
  game: GameWithNextAction,
  player: Player,
  profile: EvaluationProfile,
): Search => ({
  game,
  evaluate: createPlayerEvaluator(game, player.id, profile),
  maxSize: game.rules.basic.maxKingdomSize,
});

const bestPlacementScore = (
  search: Search,
  player: Player,
  domino: Domino,
  placements: ValidPlacement[],
): { placement: ValidPlacement; score: number; player: Player } | null => {
  let best: {
    placement: ValidPlacement;
    score: number;
    player: Player;
  } | null = null;

  for (const placement of placements) {
    const next = simulateDominoPlacement(
      search.game,
      player,
      domino,
      placement,
    );
    if (!next) continue;
    const score = search.evaluate(next);
    if (!best || score > best.score) {
      best = { placement, score, player: next };
    }
  }

  return best;
};

const getNextBatchDominoes = (game: GameWithNextAction): Domino[] => {
  const perTurn = game.rules.basic.dominoesPerTurn;
  return [...game.dominoes]
    .slice(0, perTurn)
    .sort((a, b) => a.number - b.number);
};

/**
 * Extension choices that simulate every valid target and keep the one with
 * the best mode-aware evaluation (see `botExtensions`). The dragon is never
 * used: burning a building only costs coins and brings no points to the
 * player, a benefit the evaluation cannot measure.
 */
const modeAwareExtensions = (
  profile: EvaluationProfile,
): BotExtensionChoices => ({
  chooseKnightPosition: (context) => bestKnightPosition(context, profile),
  chooseBuilding: (context) => bestBuilding(context, profile),
  chooseDragonTarget: () => null,
  chooseFireTokenPosition: (context) => bestFireTokenPosition(context, profile),
  chooseCavemanRecruitment: (context) =>
    bestCavemanRecruitment(context, profile),
  chooseGiantPosition: (context) => bestGiantPosition(context, profile),
  chooseGiantToSend: (context) => bestGiantToSend(context, profile),
});

// ─── Random Strategy ─────────────────────────────────────────────────

/**
 * Bot strategy that makes random choices, seeded by the game seed and the
 * decision point (the same game replayed with the same seed gets the same
 * decisions). Picks a random available domino, places it at a random valid
 * position, and plays every extension action on a random valid target, or
 * skips it ("skip" being one more option when the action is optional).
 */
export const randomStrategy: BotStrategy = {
  chooseDomino: (context) => {
    const { game, availableDominoes } = context;
    const pick = randomItem(decisionRandom(game, "pick"), availableDominoes);
    return (pick ?? availableDominoes[0]!).domino.number;
  },

  choosePlacement: (context) => {
    const { game, validPlacements } = context;
    return randomItem(decisionRandom(game, "place"), validPlacements) ?? null;
  },

  chooseKnightPosition: (context) =>
    randomChoice(context, context.validPositions, "knight"),

  chooseBuilding: (context) => {
    const building = randomChoice(
      context,
      context.affordableBuildings,
      "building",
    );
    const position = randomItem(
      decisionRandom(context.game, "building-position"),
      context.validPositions,
    );
    return building && position ? { buildingId: building.id, position } : null;
  },

  chooseDragonTarget: (context) =>
    randomChoice(context, context.targetBuildings, "dragon")?.id ?? null,

  chooseFireTokenPosition: (context) =>
    randomChoice(context, context.validPositions, "fire"),

  chooseCavemanRecruitment: (context) => {
    const { options, positions } = context.recruitment;
    const option = randomChoice(context, options, "caveman");
    const random = decisionRandom(context.game, "caveman-details");
    const position = randomItem(random, positions);
    const payment = option && randomItem(random, option.resourceCombinations);
    return option && position && payment
      ? { cavemanId: option.cavemanId, position, resourcePositions: payment }
      : null;
  },

  chooseGiantPosition: (context) =>
    randomChoice(
      { ...context, canSkip: false },
      context.validPositions,
      "giant",
    ),

  chooseGiantToSend: (context) => {
    const { giantIndexes, targetPlayerIds } = context.targets;
    const giantIndex = randomChoice(context, giantIndexes, "send");
    const targetPlayerId = randomItem(
      decisionRandom(context.game, "send-target"),
      targetPlayerIds,
    );
    return giantIndex !== null && targetPlayerId !== undefined
      ? { giantIndex, targetPlayerId }
      : null;
  },
};

// ─── Greedy Strategy ─────────────────────────────────────────────────

const GREEDY_PROFILE: EvaluationProfile = { opponentWeight: 0 };

/**
 * Bot strategy that maximizes the immediate mode-aware score.
 * Evaluates every valid placement and picks the one yielding the highest
 * score (territories plus every bonus of the mode). When picking a domino,
 * simulates the best placement for each option. Extension actions: the
 * target with the best own score (taxes, buildings, fire tokens, cavemen,
 * least costly crown for a giant), or skip when nothing improves it.
 */
export const greedyStrategy: BotStrategy & BotExtensionChoices = {
  chooseDomino: (context) => {
    const { game, lordId, availableDominoes } = context;
    const { player } = getLordAndPlayer(game, lordId);
    if (!player) return availableDominoes[0]!.domino.number;

    const search = createSearch(game, player, GREEDY_PROFILE);
    let bestScore = Number.NEGATIVE_INFINITY;
    let bestPick = availableDominoes[0]!.domino.number;

    for (const rd of availableDominoes) {
      const placements = getValidPlacementsUseCase(
        player.kingdom,
        rd.domino,
        search.maxSize,
      );
      const result = bestPlacementScore(search, player, rd.domino, placements);
      const score = result ? result.score : search.evaluate(player);
      if (score > bestScore) {
        bestScore = score;
        bestPick = rd.domino.number;
      }
    }

    return bestPick;
  },

  choosePlacement: (context) => {
    const { game, lordId, domino, validPlacements } = context;
    if (validPlacements.length === 0) return null;
    const { player } = getLordAndPlayer(game, lordId);
    if (!player) return validPlacements[0]!;

    const search = createSearch(game, player, GREEDY_PROFILE);
    const result = bestPlacementScore(search, player, domino, validPlacements);
    return result ? result.placement : validPlacements[0]!;
  },

  ...modeAwareExtensions(GREEDY_PROFILE),
};

// ─── Advanced Strategy ───────────────────────────────────────────────

const ADVANCED_PROFILE: EvaluationProfile = { opponentWeight: 0.5 };

const evaluateWithLookahead = (
  search: Search,
  player: Player,
  nextDominoes: Domino[],
): number => {
  if (nextDominoes.length === 0) return 0;

  let bestNextScore = 0;
  for (const nextDomino of nextDominoes) {
    const nextPlacements = getValidPlacementsUseCase(
      player.kingdom,
      nextDomino,
      search.maxSize,
    );
    const result = bestPlacementScore(
      search,
      player,
      nextDomino,
      nextPlacements,
    );
    if (result && result.score > bestNextScore) {
      bestNextScore = result.score;
    }
  }

  return bestNextScore;
};

/**
 * Bot strategy with 1-turn lookahead.
 * When making decisions, considers not just the immediate mode-aware score
 * but also the best possible score achievable in the next turn by peeking at
 * the upcoming domino batch from the draw pile. Extension actions: the target
 * with the best own score minus half the best opponent's score (e.g. sending
 * a giant to the leader, taking a Totem majority from them).
 */
export const advancedStrategy: BotStrategy & BotExtensionChoices = {
  chooseDomino: (context) => {
    const { game, lordId, availableDominoes } = context;
    const { player } = getLordAndPlayer(game, lordId);
    if (!player) return availableDominoes[0]!.domino.number;

    const search = createSearch(game, player, ADVANCED_PROFILE);
    const nextBatch = getNextBatchDominoes(game);

    let bestCombinedScore = Number.NEGATIVE_INFINITY;
    let bestPick = availableDominoes[0]!.domino.number;

    for (const rd of availableDominoes) {
      const placements = getValidPlacementsUseCase(
        player.kingdom,
        rd.domino,
        search.maxSize,
      );
      const result = bestPlacementScore(search, player, rd.domino, placements);

      const immediateScore = result ? result.score : search.evaluate(player);
      const playerAfter = result ? result.player : player;
      const futureScore = evaluateWithLookahead(search, playerAfter, nextBatch);
      const combined = immediateScore + futureScore * 0.8;

      if (combined > bestCombinedScore) {
        bestCombinedScore = combined;
        bestPick = rd.domino.number;
      }
    }

    return bestPick;
  },

  choosePlacement: (context) => {
    const { game, lordId, domino, validPlacements } = context;
    if (validPlacements.length === 0) return null;
    const { player } = getLordAndPlayer(game, lordId);
    if (!player) return validPlacements[0]!;

    const search = createSearch(game, player, ADVANCED_PROFILE);
    const nextBatch = getNextBatchDominoes(game);

    let bestCombinedScore = Number.NEGATIVE_INFINITY;
    let bestPlacement: ValidPlacement = validPlacements[0]!;

    for (const placement of validPlacements) {
      const next = simulateDominoPlacement(game, player, domino, placement);
      if (!next) continue;

      const immediateScore = search.evaluate(next);
      const futureScore = evaluateWithLookahead(search, next, nextBatch);
      const combined = immediateScore + futureScore * 0.8;

      if (combined > bestCombinedScore) {
        bestCombinedScore = combined;
        bestPlacement = placement;
      }
    }

    return bestPlacement;
  },

  ...modeAwareExtensions(ADVANCED_PROFILE),
};

// ─── Expert Strategy ─────────────────────────────────────────────────

const EXPERT_PROFILE: EvaluationProfile = { opponentWeight: 1 };

/** Maximum placements to evaluate per domino at each depth level (beam width) */
const EXPERT_BEAM_WIDTH = 2;

/** Maximum search depth for the expert strategy */
const EXPERT_MAX_DEPTH = 2;

/**
 * Ranks placements by immediate score gain (greedy heuristic)
 * and returns only the top N candidates for deeper evaluation.
 */
const topPlacements = (
  search: Search,
  player: Player,
  domino: Domino,
  placements: ValidPlacement[],
  limit: number,
): { placement: ValidPlacement; player: Player }[] => {
  const simulatedPlacements = placements.flatMap((placement) => {
    const next = simulateDominoPlacement(
      search.game,
      player,
      domino,
      placement,
    );
    return next ? [{ placement, player: next }] : [];
  });
  if (simulatedPlacements.length <= limit) return simulatedPlacements;

  return simulatedPlacements
    .map((s) => ({ ...s, score: search.evaluate(s.player) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

const expertEvaluate = (
  search: Search,
  player: Player,
  remainingDominoes: Domino[],
  dominoesPerTurn: number,
  depth: number,
): number => {
  if (depth <= 0 || remainingDominoes.length === 0) {
    return search.evaluate(player);
  }

  // Get next batch (sorted by number, as the engine does)
  const batch = [...remainingDominoes]
    .slice(0, dominoesPerTurn)
    .sort((a, b) => a.number - b.number);
  const afterBatch = remainingDominoes.slice(dominoesPerTurn);

  let bestScore = search.evaluate(player);

  for (const domino of batch) {
    const allPlacements = getValidPlacementsUseCase(
      player.kingdom,
      domino,
      search.maxSize,
    );

    if (allPlacements.length === 0) {
      const score = expertEvaluate(
        search,
        player,
        afterBatch,
        dominoesPerTurn,
        depth - 1,
      );
      if (score > bestScore) bestScore = score;
      continue;
    }

    // Prune: only evaluate top candidates by greedy score
    const candidates = topPlacements(
      search,
      player,
      domino,
      allPlacements,
      EXPERT_BEAM_WIDTH,
    );

    for (const candidate of candidates) {
      const score = expertEvaluate(
        search,
        candidate.player,
        afterBatch,
        dominoesPerTurn,
        depth - 1,
      );
      if (score > bestScore) bestScore = score;
    }
  }

  return bestScore;
};

/**
 * Bot strategy that searches the game tree with beam-search pruning.
 * Explores the next turns, but limits the number of placements evaluated per
 * domino to the top candidates (by greedy mode-aware score). Since kingdoms
 * are independent, the domino search is a solo optimization. Extension
 * actions: the target that maximizes the lead over the best opponent.
 */
export const expertStrategy: BotStrategy & BotExtensionChoices = {
  chooseDomino: (context) => {
    const { game, lordId, availableDominoes } = context;
    const { player } = getLordAndPlayer(game, lordId);
    if (!player) return availableDominoes[0]!.domino.number;

    const search = createSearch(game, player, EXPERT_PROFILE);
    const perTurn = game.rules.basic.dominoesPerTurn;
    const turnsLeft = Math.min(
      game.rules.basic.maxTurns - game.turn,
      EXPERT_MAX_DEPTH,
    );

    let bestScore = Number.NEGATIVE_INFINITY;
    let bestPick = availableDominoes[0]!.domino.number;

    for (const rd of availableDominoes) {
      const allPlacements = getValidPlacementsUseCase(
        player.kingdom,
        rd.domino,
        search.maxSize,
      );

      if (allPlacements.length === 0) {
        const score = expertEvaluate(
          search,
          player,
          game.dominoes,
          perTurn,
          turnsLeft,
        );
        if (score > bestScore) {
          bestScore = score;
          bestPick = rd.domino.number;
        }
        continue;
      }

      const candidates = topPlacements(
        search,
        player,
        rd.domino,
        allPlacements,
        EXPERT_BEAM_WIDTH,
      );

      for (const candidate of candidates) {
        const score = expertEvaluate(
          search,
          candidate.player,
          game.dominoes,
          perTurn,
          turnsLeft,
        );
        if (score > bestScore) {
          bestScore = score;
          bestPick = rd.domino.number;
        }
      }
    }

    return bestPick;
  },

  choosePlacement: (context) => {
    const { game, lordId, domino, validPlacements } = context;
    if (validPlacements.length === 0) return null;
    const { player } = getLordAndPlayer(game, lordId);
    if (!player) return validPlacements[0]!;

    const search = createSearch(game, player, EXPERT_PROFILE);
    const perTurn = game.rules.basic.dominoesPerTurn;
    const turnsLeft = Math.min(
      game.rules.basic.maxTurns - game.turn,
      EXPERT_MAX_DEPTH,
    );

    let bestScore = Number.NEGATIVE_INFINITY;
    let bestPlacement: ValidPlacement = validPlacements[0]!;

    for (const placement of validPlacements) {
      const next = simulateDominoPlacement(game, player, domino, placement);
      if (!next) continue;

      const score = expertEvaluate(
        search,
        next,
        game.dominoes,
        perTurn,
        turnsLeft,
      );
      if (score > bestScore) {
        bestScore = score;
        bestPlacement = placement;
      }
    }

    return bestPlacement;
  },

  ...modeAwareExtensions(EXPERT_PROFILE),
};

// ─── playBotTurn ─────────────────────────────────────────────────────

/**
 * Plays an optional extension action: skipped without asking the strategy
 * when it has no valid target, otherwise the strategy's choice (or the greedy
 * choice when the strategy has no method for this action), `null` skipping.
 */
const playOptional = <C extends { canSkip: boolean }, T>(
  engine: GameEngine,
  game: GameWithNextAction,
  context: C,
  hasTarget: boolean,
  choose: ((context: C) => T | null) | undefined,
  fallback: (context: C) => T | null,
  apply: (choice: T) => GameState,
): GameState => {
  const lordId = game.nextAction.nextLord;
  if (!hasTarget) return engine.skipOptionalAction({ game, lordId });
  const choice = (choose ?? fallback)(context);
  return choice === null
    ? engine.skipOptionalAction({ game, lordId })
    : apply(choice);
};

/**
 * Executes a single bot turn using the given strategy and engine.
 * Reads the current game state to determine the required action,
 * asks the strategy for a decision, and executes it via the engine.
 *
 * @param engine - The game engine instance
 * @param game - Current game state (must require a player action)
 * @param strategy - The bot strategy to use for decisions
 * @returns Updated game state after the bot's action
 */
export const playBotTurn = (
  engine: GameEngine,
  game: GameWithNextAction,
  strategy: BotStrategy,
): GameState => {
  const lordId = game.nextAction.nextLord;
  const action = game.nextAction.nextAction;
  const defaults = greedyStrategy;

  if (action === "pickDomino") {
    const availableDominoes = game.currentDominoes.filter((d) => !d.picked);
    const dominoPick = strategy.chooseDomino({
      game,
      lordId,
      availableDominoes,
    });
    return engine.chooseDomino({ game, lordId, dominoPick });
  }

  if (action === "placeDomino") {
    const { lord, player } = getLordAndPlayer(game, lordId);
    if (!lord?.dominoPicked || !player) {
      return engine.discardDomino({ game, lordId });
    }

    const domino = lord.dominoPicked;
    const kingdom = player.kingdom;
    const maxSize = game.rules.basic.maxKingdomSize;
    const validPlacements = getValidPlacementsUseCase(kingdom, domino, maxSize);

    const placement = strategy.choosePlacement({
      game,
      lordId,
      domino,
      kingdom,
      validPlacements,
    });

    if (!placement) {
      return engine.discardDomino({ game, lordId });
    }

    return engine.placeDomino({
      game,
      lordId,
      position: placement.position,
      rotation: placement.rotation,
    });
  }

  // Age of Giants: placeGiant is mandatory (own giant, or a giant sent by an
  // opponent: the targeted player chooses the crown of their own kingdom)
  if (action === "placeGiant") {
    const context = giantPositionContext(game, lordId);
    if (context.validPositions.length === 0) {
      return engine.skipOptionalAction({ game, lordId });
    }
    const position =
      strategy.chooseGiantPosition?.(context) ??
      defaults.chooseGiantPosition(context) ??
      context.validPositions[0]!;
    return engine.placeGiant({ game, lordId, position });
  }

  if (action === "placeKnight") {
    const context = knightContext(game, lordId);
    return playOptional(
      engine,
      game,
      context,
      context.validPositions.length > 0,
      strategy.chooseKnightPosition,
      defaults.chooseKnightPosition,
      (position) => engine.placeKnight({ game, lordId, position }),
    );
  }

  if (action === "constructBuilding") {
    const context = buildingContext(game, lordId);
    return playOptional(
      engine,
      game,
      context,
      context.validPositions.length > 0 &&
        context.affordableBuildings.length > 0,
      strategy.chooseBuilding,
      defaults.chooseBuilding,
      ({ buildingId, position }) =>
        engine.constructBuilding({ game, lordId, buildingId, position }),
    );
  }

  if (action === "useDragon") {
    const context = dragonContext(game, lordId);
    return playOptional(
      engine,
      game,
      context,
      context.targetBuildings.length > 0,
      strategy.chooseDragonTarget,
      defaults.chooseDragonTarget,
      (buildingId) => engine.useDragon({ game, lordId, buildingId }),
    );
  }

  if (action === "placeFireToken") {
    const context = fireTokenContext(game, lordId);
    return playOptional(
      engine,
      game,
      context,
      context.validPositions.length > 0,
      strategy.chooseFireTokenPosition,
      defaults.chooseFireTokenPosition,
      (position) => engine.placeFireToken({ game, lordId, position }),
    );
  }

  if (action === "recruitCaveman") {
    const context = cavemanContext(game, lordId);
    return playOptional(
      engine,
      game,
      context,
      context.recruitment.options.length > 0,
      strategy.chooseCavemanRecruitment,
      defaults.chooseCavemanRecruitment,
      ({ cavemanId, position, resourcePositions }) =>
        engine.recruitCaveman({
          game,
          lordId,
          cavemanId,
          position,
          resourcePositions,
        }),
    );
  }

  if (action === "sendGiant") {
    const context = sendGiantContext(game, lordId);
    return playOptional(
      engine,
      game,
      context,
      context.targets.giantIndexes.length > 0,
      strategy.chooseGiantToSend,
      defaults.chooseGiantToSend,
      ({ giantIndex, targetPlayerId }) =>
        engine.sendGiant({ game, lordId, giantIndex, targetPlayerId }),
    );
  }

  // action === "pass"
  return engine.discardDomino({ game, lordId });
};

// ─── Mixed human/bot helpers ────────────────────────────────────────

/**
 * Checks if the current turn belongs to a bot player.
 */
export const isBotTurn = (game: GameWithNextAction): boolean => {
  const lordId = game.nextAction.nextLord;
  const lord = game.lords.find((l) => l.id === lordId);
  const player = lord
    ? game.players.find((p) => p.id === lord.playerId)
    : undefined;
  return !!player?.bot;
};

/**
 * Plays all consecutive bot turns until a human turn or game end is reached.
 * Resolves each bot's strategy by name from the registry (or custom map).
 * Falls back to randomStrategy if the strategy name is not found.
 *
 * @param engine - The game engine instance
 * @param game - Current game state
 * @param customStrategies - Optional custom strategy map (name → BotStrategy)
 * @returns Updated game state paused at the next human turn or game end
 */
export const playBotTurns = (
  engine: GameEngine,
  game: GameState,
  customStrategies?: Record<string, BotStrategy>,
): GameState => {
  let current = game;

  while (isGameWithNextAction(current) && isBotTurn(current)) {
    const lordId = current.nextAction.nextLord;
    const lord = current.lords.find((l) => l.id === lordId);
    const player = lord
      ? current.players.find((p) => p.id === lord.playerId)
      : undefined;
    const strategyName = player?.bot?.strategyName ?? "random";
    const strategy =
      getStrategy(strategyName, customStrategies) ?? randomStrategy;
    current = playBotTurn(engine, current, strategy);
  }

  return current;
};
