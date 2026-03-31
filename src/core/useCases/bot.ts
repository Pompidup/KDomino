import type {
  Domino,
  RevealsDomino,
  Kingdom,
  GameWithNextAction,
  GameState,
  Score,
} from "@core/domain/types/index.js";
import type { ValidPlacement } from "./getValidPlacements.js";
import type { GameEngine } from "@core/portUserside/engine.js";
import { placeDomino } from "@core/domain/entities/kingdom.js";
import { calculateScoreUseCase } from "./calculateScore.js";
import { getValidPlacementsUseCase } from "./getValidPlacements.js";
import { isOk } from "@utils/result.js";

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
 * A bot strategy that decides which domino to pick and where to place it.
 * Strategies are stateless — all information comes from the context.
 */
export type BotStrategy = {
  chooseDomino: (context: PickContext) => number;
  choosePlacement: (context: PlaceContext) => ValidPlacement | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────

const scoreKingdom = (kingdom: Kingdom): number => {
  const result = calculateScoreUseCase(kingdom);
  return isOk(result) ? result.value.points : 0;
};

const simulatePlacement = (
  kingdom: Kingdom,
  domino: Domino,
  placement: ValidPlacement,
  maxKingdomSize: number
): Kingdom | null => {
  const result = placeDomino(
    kingdom,
    placement.position,
    placement.rotation,
    domino,
    maxKingdomSize
  );
  return isOk(result) ? result.value : null;
};

const bestPlacementScore = (
  kingdom: Kingdom,
  domino: Domino,
  placements: ValidPlacement[],
  maxKingdomSize: number
): { placement: ValidPlacement; score: number; kingdom: Kingdom } | null => {
  let best: { placement: ValidPlacement; score: number; kingdom: Kingdom } | null = null;

  for (const placement of placements) {
    const newKingdom = simulatePlacement(kingdom, domino, placement, maxKingdomSize);
    if (!newKingdom) continue;
    const score = scoreKingdom(newKingdom);
    if (!best || score > best.score) {
      best = { placement, score, kingdom: newKingdom };
    }
  }

  return best;
};

const getMaxKingdomSize = (game: GameWithNextAction): number =>
  game.rules.basic.maxKingdomSize;

const getLordAndPlayer = (game: GameWithNextAction, lordId: string) => {
  const lord = game.lords.find((l) => l.id === lordId);
  const player = lord
    ? game.players.find((p) => p.id === lord.playerId)
    : undefined;
  return { lord, player };
};

const getNextBatchDominoes = (game: GameWithNextAction): Domino[] => {
  const perTurn = game.rules.basic.dominoesPerTurn;
  return [...game.dominoes]
    .slice(0, perTurn)
    .sort((a, b) => a.number - b.number);
};

// ─── Random Strategy ─────────────────────────────────────────────────

/**
 * Bot strategy that makes random choices.
 * Picks a random available domino and places it at a random valid position.
 */
export const randomStrategy: BotStrategy = {
  chooseDomino: (context) => {
    const { availableDominoes } = context;
    const idx = Math.floor(Math.random() * availableDominoes.length);
    return availableDominoes[idx]!.domino.number;
  },

  choosePlacement: (context) => {
    const { validPlacements } = context;
    if (validPlacements.length === 0) return null;
    const idx = Math.floor(Math.random() * validPlacements.length);
    return validPlacements[idx]!;
  },
};

// ─── Greedy Strategy ─────────────────────────────────────────────────

/**
 * Bot strategy that maximizes the immediate score.
 * Evaluates every valid placement and picks the one yielding the highest score.
 * When picking a domino, simulates the best placement for each option.
 */
export const greedyStrategy: BotStrategy = {
  chooseDomino: (context) => {
    const { game, lordId, availableDominoes } = context;
    const { player } = getLordAndPlayer(game, lordId);
    if (!player) return availableDominoes[0]!.domino.number;

    const maxSize = getMaxKingdomSize(game);
    let bestScore = -1;
    let bestPick = availableDominoes[0]!.domino.number;

    for (const rd of availableDominoes) {
      const placements = getValidPlacementsUseCase(
        player.kingdom,
        rd.domino,
        maxSize
      );
      const result = bestPlacementScore(
        player.kingdom,
        rd.domino,
        placements,
        maxSize
      );
      const score = result ? result.score : 0;
      if (score > bestScore) {
        bestScore = score;
        bestPick = rd.domino.number;
      }
    }

    return bestPick;
  },

  choosePlacement: (context) => {
    const { game, domino, kingdom, validPlacements } = context;
    if (validPlacements.length === 0) return null;

    const maxSize = getMaxKingdomSize(game);
    const result = bestPlacementScore(kingdom, domino, validPlacements, maxSize);
    return result ? result.placement : validPlacements[0]!;
  },
};

// ─── Advanced Strategy ───────────────────────────────────────────────

const evaluateWithLookahead = (
  kingdom: Kingdom,
  maxSize: number,
  nextDominoes: Domino[]
): number => {
  if (nextDominoes.length === 0) return 0;

  let bestNextScore = 0;
  for (const nextDomino of nextDominoes) {
    const nextPlacements = getValidPlacementsUseCase(kingdom, nextDomino, maxSize);
    const result = bestPlacementScore(kingdom, nextDomino, nextPlacements, maxSize);
    if (result && result.score > bestNextScore) {
      bestNextScore = result.score;
    }
  }

  return bestNextScore;
};

/**
 * Bot strategy with 1-turn lookahead.
 * When making decisions, considers not just the immediate score but also
 * the best possible score achievable in the next turn by peeking at
 * the upcoming domino batch from the draw pile.
 */
export const advancedStrategy: BotStrategy = {
  chooseDomino: (context) => {
    const { game, lordId, availableDominoes } = context;
    const { player } = getLordAndPlayer(game, lordId);
    if (!player) return availableDominoes[0]!.domino.number;

    const maxSize = getMaxKingdomSize(game);
    const nextBatch = getNextBatchDominoes(game);

    let bestCombinedScore = -1;
    let bestPick = availableDominoes[0]!.domino.number;

    for (const rd of availableDominoes) {
      const placements = getValidPlacementsUseCase(
        player.kingdom,
        rd.domino,
        maxSize
      );
      const result = bestPlacementScore(
        player.kingdom,
        rd.domino,
        placements,
        maxSize
      );

      const immediateScore = result ? result.score : scoreKingdom(player.kingdom);
      const kingdomAfter = result ? result.kingdom : player.kingdom;
      const futureScore = evaluateWithLookahead(kingdomAfter, maxSize, nextBatch);
      const combined = immediateScore + futureScore * 0.8;

      if (combined > bestCombinedScore) {
        bestCombinedScore = combined;
        bestPick = rd.domino.number;
      }
    }

    return bestPick;
  },

  choosePlacement: (context) => {
    const { game, domino, kingdom, validPlacements } = context;
    if (validPlacements.length === 0) return null;

    const maxSize = getMaxKingdomSize(game);
    const nextBatch = getNextBatchDominoes(game);

    let bestCombinedScore = -1;
    let bestPlacement: ValidPlacement = validPlacements[0]!;

    for (const placement of validPlacements) {
      const newKingdom = simulatePlacement(kingdom, domino, placement, maxSize);
      if (!newKingdom) continue;

      const immediateScore = scoreKingdom(newKingdom);
      const futureScore = evaluateWithLookahead(newKingdom, maxSize, nextBatch);
      const combined = immediateScore + futureScore * 0.8;

      if (combined > bestCombinedScore) {
        bestCombinedScore = combined;
        bestPlacement = placement;
      }
    }

    return bestPlacement;
  },
};

// ─── Expert Strategy ─────────────────────────────────────────────────

/** Maximum placements to evaluate per domino at each depth level (beam width) */
const EXPERT_BEAM_WIDTH = 2;

/** Maximum search depth for the expert strategy */
const EXPERT_MAX_DEPTH = 2;

/**
 * Ranks placements by immediate score gain (greedy heuristic)
 * and returns only the top N candidates for deeper evaluation.
 */
const topPlacements = (
  kingdom: Kingdom,
  domino: Domino,
  placements: ValidPlacement[],
  maxSize: number,
  limit: number
): ValidPlacement[] => {
  if (placements.length <= limit) return placements;

  const scored = placements
    .map((p) => {
      const k = simulatePlacement(kingdom, domino, p, maxSize);
      return { placement: p, score: k ? scoreKingdom(k) : 0 };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.placement);
};

const expertEvaluate = (
  kingdom: Kingdom,
  remainingDominoes: Domino[],
  dominoesPerTurn: number,
  maxSize: number,
  depth: number
): number => {
  if (depth <= 0 || remainingDominoes.length === 0) {
    return scoreKingdom(kingdom);
  }

  // Get next batch (sorted by number, as the engine does)
  const batch = [...remainingDominoes]
    .slice(0, dominoesPerTurn)
    .sort((a, b) => a.number - b.number);
  const afterBatch = remainingDominoes.slice(dominoesPerTurn);

  let bestScore = scoreKingdom(kingdom);

  for (const domino of batch) {
    const allPlacements = getValidPlacementsUseCase(kingdom, domino, maxSize);

    if (allPlacements.length === 0) {
      const score = expertEvaluate(
        kingdom,
        afterBatch,
        dominoesPerTurn,
        maxSize,
        depth - 1
      );
      if (score > bestScore) bestScore = score;
      continue;
    }

    // Prune: only evaluate top candidates by greedy score
    const candidates = topPlacements(
      kingdom,
      domino,
      allPlacements,
      maxSize,
      EXPERT_BEAM_WIDTH
    );

    for (const placement of candidates) {
      const newKingdom = simulatePlacement(kingdom, domino, placement, maxSize);
      if (!newKingdom) continue;

      const score = expertEvaluate(
        newKingdom,
        afterBatch,
        dominoesPerTurn,
        maxSize,
        depth - 1
      );
      if (score > bestScore) bestScore = score;
    }
  }

  return bestScore;
};

/**
 * Bot strategy that searches the game tree with beam-search pruning.
 * Explores all remaining turns, but limits the number of placements
 * evaluated per domino to the top candidates (by greedy score).
 * Since kingdoms are independent, this is a solo optimization (no adversarial search needed).
 */
export const expertStrategy: BotStrategy = {
  chooseDomino: (context) => {
    const { game, lordId, availableDominoes } = context;
    const { player } = getLordAndPlayer(game, lordId);
    if (!player) return availableDominoes[0]!.domino.number;

    const maxSize = getMaxKingdomSize(game);
    const perTurn = game.rules.basic.dominoesPerTurn;
    const turnsLeft = Math.min(
      game.rules.basic.maxTurns - game.turn,
      EXPERT_MAX_DEPTH
    );

    let bestScore = -1;
    let bestPick = availableDominoes[0]!.domino.number;

    for (const rd of availableDominoes) {
      const allPlacements = getValidPlacementsUseCase(
        player.kingdom,
        rd.domino,
        maxSize
      );

      if (allPlacements.length === 0) {
        const score = expertEvaluate(
          player.kingdom,
          game.dominoes,
          perTurn,
          maxSize,
          turnsLeft
        );
        if (score > bestScore) {
          bestScore = score;
          bestPick = rd.domino.number;
        }
        continue;
      }

      const candidates = topPlacements(
        player.kingdom,
        rd.domino,
        allPlacements,
        maxSize,
        EXPERT_BEAM_WIDTH
      );

      for (const placement of candidates) {
        const newKingdom = simulatePlacement(
          player.kingdom,
          rd.domino,
          placement,
          maxSize
        );
        if (!newKingdom) continue;

        const score = expertEvaluate(
          newKingdom,
          game.dominoes,
          perTurn,
          maxSize,
          turnsLeft
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
    const { game, domino, kingdom, validPlacements } = context;
    if (validPlacements.length === 0) return null;

    const maxSize = getMaxKingdomSize(game);
    const perTurn = game.rules.basic.dominoesPerTurn;
    const turnsLeft = Math.min(
      game.rules.basic.maxTurns - game.turn,
      EXPERT_MAX_DEPTH
    );

    let bestScore = -1;
    let bestPlacement: ValidPlacement = validPlacements[0]!;

    for (const placement of validPlacements) {
      const newKingdom = simulatePlacement(kingdom, domino, placement, maxSize);
      if (!newKingdom) continue;

      const score = expertEvaluate(
        newKingdom,
        game.dominoes,
        perTurn,
        maxSize,
        turnsLeft
      );
      if (score > bestScore) {
        bestScore = score;
        bestPlacement = placement;
      }
    }

    return bestPlacement;
  },
};

// ─── playBotTurn ─────────────────────────────────────────────────────

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
  strategy: BotStrategy
): GameState => {
  const lordId = game.nextAction.nextLord;
  const action = game.nextAction.nextAction;

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
    const maxSize = getMaxKingdomSize(game);
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

  // action === "pass"
  return engine.discardDomino({ game, lordId });
};
