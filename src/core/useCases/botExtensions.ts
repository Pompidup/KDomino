/**
 * Mode-aware evaluation and extension-action decisions of the built-in bots
 * (Queendomino, Kingdomino Origins, Age of Giants).
 *
 * Every decision follows the same recipe, without re-implementing any rule:
 * 1. enumerate the valid targets of the action (`getValidActionTargets`, whose
 *    targets are guaranteed to be accepted by the action), plus "skip" when
 *    `canSkipOptionalAction` allows it;
 * 2. simulate each target with the pure use case of the action;
 * 3. evaluate the resulting state with the mode-aware live score
 *    (`computePlayerScore`) of the deciding player, plus a small value for the
 *    assets the score does not count yet (coins, knights left, Tribe
 *    resources), optionally minus the score of the best opponent;
 * 4. keep the best target (the first one on ties, "skip" coming first).
 */

import { getMaxKnights } from "@core/domain/entities/economy.js";
import {
  calculateDominoPosition,
  placeDomino,
} from "@core/domain/entities/kingdom.js";
import {
  isResourceMode,
  isTotemMode,
  isTribeMode,
} from "@core/domain/entities/originsHelpers.js";
import { createResourceForTile } from "@core/domain/entities/resource.js";
import { computePlayerScore } from "@core/domain/entities/scoreBreakdown.js";
import type { BuildingTile } from "@core/domain/types/building.js";
import type { Domino } from "@core/domain/types/domino.js";
import {
  type Game,
  type GameState,
  type GameStateResult,
  type GameWithNextAction,
  isGameWithNextAction,
} from "@core/domain/types/game.js";
import type { Position } from "@core/domain/types/kingdom.js";
import type { Resource } from "@core/domain/types/origins.js";
import { type Player, playerActions } from "@core/domain/types/player.js";
import { isOk } from "@utils/result.js";
import { createSeededRandom } from "@utils/seededShuffle.js";
import { constructBuildingUseCase } from "./constructBuilding.js";
import {
  type CavemanRecruitmentOption,
  canSkipOptionalActionUseCase,
  getAffordableBuildingsUseCase,
  getValidBuildingPositionsUseCase,
  getValidCavemanPlacementsUseCase,
  getValidFireTokenPositionsUseCase,
  getValidGiantPositionsUseCase,
  getValidGiantTargetsUseCase,
  getValidKnightPositionsUseCase,
  type ValidCavemanPlacements,
  type ValidGiantTargets,
} from "./getValidActionTargets.js";
import type { ValidPlacement } from "./getValidPlacements.js";
import { placeFireTokenUseCase } from "./placeFireToken.js";
import { placeGiantUseCase } from "./placeGiant.js";
import { placeKnightUseCase } from "./placeKnight.js";
import { recruitCavemanUseCase } from "./recruitCaveman.js";
import { sendGiantUseCase } from "./sendGiant.js";
import { useDragonUseCase } from "./useDragon.js";

// ─── Contexts and choices (public) ──────────────────────────────────

/**
 * Common part of the context given to a bot strategy for an extension action.
 */
export type ExtensionContext = {
  game: GameWithNextAction;
  /** Lord whose action it is (`game.nextAction.nextLord`) */
  lordId: string;
  /**
   * Player who decides: the owner of the lord. For a giant sent by an
   * opponent (`ageOfGiants.pendingGiant`), the targeted player.
   */
  playerId: string;
  /** Whether returning `null` (skipping the action) is allowed */
  canSkip: boolean;
};

/** `placeKnight` (Queendomino): squares where a knight can go. */
export type KnightContext = ExtensionContext & { validPositions: Position[] };

/** `constructBuilding` (Queendomino): any building on any square. */
export type BuildingContext = ExtensionContext & {
  validPositions: Position[];
  affordableBuildings: BuildingTile[];
};

/** A building to construct and its construction square. */
export type BuildingChoice = { buildingId: number; position: Position };

/** `useDragon` (Queendomino): buildings of the board the dragon can burn. */
export type DragonContext = ExtensionContext & {
  targetBuildings: BuildingTile[];
};

/** `placeFireToken` (Origins): squares where the pending token can go. */
export type FireTokenContext = ExtensionContext & {
  validPositions: Position[];
};

/** `recruitCaveman` (Origins Tribe): recruitable cavemen and squares. */
export type CavemanContext = ExtensionContext & {
  recruitment: ValidCavemanPlacements;
};

/** A caveman to recruit, where to place it and how to pay for it. */
export type CavemanChoice = {
  cavemanId: number;
  position: Position;
  resourcePositions: Position[];
};

/**
 * `placeGiant` (Age of Giants, mandatory): crowns of the deciding player's
 * kingdom the giant can cover.
 */
export type GiantPositionContext = ExtensionContext & {
  validPositions: Position[];
  /** True when the giant was sent by an opponent (`pendingGiant`) */
  sentByOpponent: boolean;
};

/** `sendGiant` (Age of Giants): giants that can be sent and their targets. */
export type SendGiantContext = ExtensionContext & {
  targets: ValidGiantTargets;
};

/** A giant to send and the opponent receiving it. */
export type SendGiantChoice = { giantIndex: number; targetPlayerId: string };

// ─── Context builders ───────────────────────────────────────────────

const lordOwner = (game: Game, lordId: string): Player | undefined => {
  const lord = game.lords.find((l) => l.id === lordId);
  return lord ? game.players.find((p) => p.id === lord.playerId) : undefined;
};

const baseContext = (
  game: GameWithNextAction,
  lordId: string,
): ExtensionContext => ({
  game,
  lordId,
  playerId: lordOwner(game, lordId)?.id ?? "",
  canSkip: canSkipOptionalActionUseCase(game, lordId),
});

export const knightContext = (
  game: GameWithNextAction,
  lordId: string,
): KnightContext => ({
  ...baseContext(game, lordId),
  validPositions: getValidKnightPositionsUseCase(game, lordId),
});

export const buildingContext = (
  game: GameWithNextAction,
  lordId: string,
): BuildingContext => ({
  ...baseContext(game, lordId),
  validPositions: getValidBuildingPositionsUseCase(game, lordId),
  affordableBuildings: getAffordableBuildingsUseCase(game, lordId),
});

/**
 * Buildings the dragon can burn: there is no valid-target query for the
 * dragon, so every building of the board is tried with the use case itself.
 */
export const dragonContext = (
  game: GameWithNextAction,
  lordId: string,
): DragonContext => {
  const slots = game.queendomino?.buildersBoard.slots ?? [];
  return {
    ...baseContext(game, lordId),
    targetBuildings: slots.filter(
      (slot): slot is BuildingTile =>
        slot !== null && isOk(useDragonUseCase(game, lordId, slot.id)),
    ),
  };
};

export const fireTokenContext = (
  game: GameWithNextAction,
  lordId: string,
): FireTokenContext => ({
  ...baseContext(game, lordId),
  validPositions: getValidFireTokenPositionsUseCase(game, lordId),
});

export const cavemanContext = (
  game: GameWithNextAction,
  lordId: string,
): CavemanContext => ({
  ...baseContext(game, lordId),
  recruitment: getValidCavemanPlacementsUseCase(game, lordId),
});

export const giantPositionContext = (
  game: GameWithNextAction,
  lordId: string,
): GiantPositionContext => ({
  ...baseContext(game, lordId),
  validPositions: getValidGiantPositionsUseCase(game, lordId),
  sentByOpponent: !!game.ageOfGiants?.pendingGiant,
});

export const sendGiantContext = (
  game: GameWithNextAction,
  lordId: string,
): SendGiantContext => ({
  ...baseContext(game, lordId),
  targets: getValidGiantTargetsUseCase(game, lordId),
});

// ─── Evaluation ─────────────────────────────────────────────────────

/** Value of one coin while coins can still be spent (Queendomino). */
export const COIN_VALUE = 0.5;
/**
 * Value of one knight not placed yet while it can still collect taxes (one
 * coin per construction square of the territory): with `COIN_VALUE` 0.5, a
 * knight is placed for 2 coins of tax or more, kept for a better territory
 * otherwise.
 */
export const KNIGHT_VALUE = 0.75;
/** Value of one resource while it can still pay a caveman (Tribe). */
export const TRIBE_RESOURCE_VALUE = 0.5;
/** Weight of the opponents' total, to break ties (e.g. which opponent to hit). */
const OPPONENT_TIE_BREAK = 1e-3;

/**
 * Evaluation settings of a strategy: `opponentWeight` 0 maximizes the own
 * score, 1 maximizes the lead over the best opponent.
 */
export type EvaluationProfile = { opponentWeight: number };

/**
 * Share of the game still to be played: assets that only pay off later
 * (coins, knights, Tribe resources) lose their value as the end approaches.
 */
const remainingShare = (game: Game): number => {
  const { maxTurns } = game.rules.basic;
  return maxTurns > 0 ? Math.max(0, (maxTurns - game.turn) / maxTurns) : 0;
};

/**
 * Heuristic value of what the score does not count yet: coins and knights
 * left (Queendomino), resources (Tribe, where they pay cavemen; in Totem they
 * already score one point each).
 */
const assetValue = (game: Game, player: Player): number => {
  const share = remainingShare(game);
  if (share === 0) return 0;
  let value = 0;
  if (game.queendomino) {
    value += COIN_VALUE * share * (player.coins ?? 0);
    const knightsLeft = getMaxKnights(player) - (player.knights ?? []).length;
    value += KNIGHT_VALUE * share * Math.max(0, knightsLeft);
  }
  if (isTribeMode(game.mode.name)) {
    value += TRIBE_RESOURCE_VALUE * share * (player.resources ?? []).length;
  }
  return value;
};

/**
 * Mode-aware live value of a player: score (territories and every bonus of
 * the mode, provisional ones included) plus the asset heuristic.
 */
export const playerValue = (game: Game, player: Player): number =>
  computePlayerScore(game, player, false).points + assetValue(game, player);

/**
 * Objective of `playerId` on a game state: own value minus `opponentWeight`
 * times the best opponent's value (and a tiny share of all opponents' values
 * to break ties).
 */
export const evaluateState = (
  game: Game,
  playerId: string,
  profile: EvaluationProfile,
): number => {
  let self = 0;
  let best = 0;
  let total = 0;
  let hasOpponent = false;
  for (const player of game.players) {
    const value = playerValue(game, player);
    if (player.id === playerId) {
      self = value;
    } else {
      total += value;
      best = hasOpponent ? Math.max(best, value) : value;
      hasOpponent = true;
    }
  }
  return self - profile.opponentWeight * best - OPPONENT_TIE_BREAK * total;
};

/**
 * Evaluator of hypothetical versions of one player (e.g. after a domino
 * placement), used by the domino searches. Opponents are only re-evaluated
 * when the player's kingdom changes their score (Totem majorities).
 */
export type PlayerEvaluator = (player: Player) => number;

export const createPlayerEvaluator = (
  game: Game,
  playerId: string,
  profile: EvaluationProfile,
): PlayerEvaluator => {
  const withPlayer = (player: Player): Game => ({
    ...game,
    players: game.players.map((p) => (p.id === playerId ? player : p)),
  });

  if (isTotemMode(game.mode.name)) {
    return (player) => evaluateState(withPlayer(player), playerId, profile);
  }

  // Opponents do not depend on the player's kingdom: compute them once
  const self = game.players.find((p) => p.id === playerId);
  const constant = self
    ? evaluateState(game, playerId, profile) - playerValue(game, self)
    : 0;
  return (player) => playerValue(game, player) + constant;
};

/**
 * Hypothetical player after placing a domino: kingdom updated and, in the
 * resource modes (Totem, Tribe), the resources of the placed squares collected
 * the way `placeDomino` collects them.
 */
export const simulateDominoPlacement = (
  game: Game,
  player: Player,
  domino: Domino,
  placement: ValidPlacement,
): Player | null => {
  const kingdom = placeDomino(
    player.kingdom,
    placement.position,
    placement.rotation,
    domino,
    game.rules.basic.maxKingdomSize,
  );
  if (!isOk(kingdom)) return null;
  if (!isResourceMode(game.mode.name) || !player.resources) {
    return { ...player, kingdom: kingdom.value };
  }

  const added = calculateDominoPosition(
    placement.position,
    placement.rotation,
    domino,
  )
    .map((placed) => createResourceForTile(placed.tile, placed.position))
    .filter((resource): resource is Resource => resource !== null);
  return {
    ...player,
    kingdom: kingdom.value,
    resources: [...player.resources, ...added],
  };
};

// ─── Best choice (simulate and evaluate) ────────────────────────────

const simulated = (result: GameStateResult): GameState | null =>
  isOk(result) ? result.value : null;

/**
 * Keeps the choice with the best evaluation of the state it leads to.
 * "Skip" (the current state) comes first when allowed, so a choice must be
 * strictly better than doing nothing; on ties the first choice wins.
 */
const pickBest = <T>(
  context: ExtensionContext,
  choices: T[],
  apply: (choice: T) => GameState | null,
  profile: EvaluationProfile,
): T | null => {
  let best: T | null = null;
  let bestValue = context.canSkip
    ? evaluateState(context.game, context.playerId, profile)
    : Number.NEGATIVE_INFINITY;

  for (const choice of choices) {
    const state = apply(choice);
    if (!state) continue;
    const value = evaluateState(state, context.playerId, profile);
    if (value > bestValue) {
      bestValue = value;
      best = choice;
    }
  }

  // A mandatory action always gets a target
  if (best === null && !context.canSkip) return choices[0] ?? null;
  return best;
};

/** Best knight square (most taxes, when worth spending a knight). */
export const bestKnightPosition = (
  context: KnightContext,
  profile: EvaluationProfile,
): Position | null =>
  pickBest(
    context,
    context.validPositions,
    (position) =>
      simulated(placeKnightUseCase(context.game, context.lordId, position)),
    profile,
  );

/** Best building and construction square (crowns, end-game points, Queen). */
export const bestBuilding = (
  context: BuildingContext,
  profile: EvaluationProfile,
): BuildingChoice | null =>
  pickBest(
    context,
    context.affordableBuildings.flatMap((building) =>
      context.validPositions.map((position) => ({
        buildingId: building.id,
        position,
      })),
    ),
    (choice) =>
      simulated(
        constructBuildingUseCase(
          context.game,
          context.lordId,
          choice.buildingId,
          choice.position,
        ),
      ),
    profile,
  );

/** Best fire token square (largest region multiplied). */
export const bestFireTokenPosition = (
  context: FireTokenContext,
  profile: EvaluationProfile,
): Position | null =>
  pickBest(
    context,
    context.validPositions,
    (position) =>
      simulated(placeFireTokenUseCase(context.game, context.lordId, position)),
    profile,
  );

/**
 * Maximum payments tried per caveman (Tribe). A player with many resources
 * has many valid payments (combinations of 2 or 4 resources of different
 * types): the bots try the first ones only, which bounds the search.
 */
export const MAX_RESOURCE_COMBINATIONS = 8;

/**
 * Best caveman recruitment (Tribe). Only the visible cavemen are considered:
 * the draw pile is face-down, and simulating one of its cavemen would reveal
 * it. The search is done in two bounded steps: the best square with the first
 * payment of each caveman, then the best payment (among the first
 * `MAX_RESOURCE_COMBINATIONS`) for that caveman and square.
 */
export const bestCavemanRecruitment = (
  context: CavemanContext,
  profile: EvaluationProfile,
): CavemanChoice | null => {
  const { options, positions } = context.recruitment;
  const recruit = (choice: CavemanChoice) =>
    simulated(
      recruitCavemanUseCase(
        context.game,
        context.lordId,
        choice.cavemanId,
        choice.position,
        choice.resourcePositions,
      ),
    );

  const visible = options.filter(
    (option: CavemanRecruitmentOption) => option.source === "visible",
  );
  const placed = pickBest(
    context,
    visible.flatMap((option) =>
      positions.map(
        (position): CavemanChoice => ({
          cavemanId: option.cavemanId,
          position,
          resourcePositions: option.resourceCombinations[0] ?? [],
        }),
      ),
    ),
    recruit,
    profile,
  );
  if (!placed) return null;

  const option = visible.find((o) => o.cavemanId === placed.cavemanId);
  const payments = (option?.resourceCombinations ?? []).slice(
    0,
    MAX_RESOURCE_COMBINATIONS,
  );
  return (
    pickBest(
      { ...context, canSkip: false },
      payments.map((resourcePositions) => ({ ...placed, resourcePositions })),
      recruit,
      profile,
    ) ?? placed
  );
};

/**
 * Crown that costs the deciding player the least (mandatory placement, own
 * giant or giant sent by an opponent).
 */
export const bestGiantPosition = (
  context: GiantPositionContext,
  profile: EvaluationProfile,
): Position | null =>
  pickBest(
    { ...context, canSkip: false },
    context.validPositions,
    (position) =>
      simulated(placeGiantUseCase(context.game, context.lordId, position)),
    profile,
  );

/**
 * Resolves a giant sent to an opponent who must choose the crown: the
 * opponent is assumed to cover the crown that costs them the least.
 */
const resolvePendingGiant = (state: GameState): GameState => {
  if (
    !isGameWithNextAction(state) ||
    state.nextAction.nextAction !== playerActions.placeGiant ||
    !state.ageOfGiants?.pendingGiant
  ) {
    return state;
  }
  const targetLordId = state.nextAction.nextLord;
  const targetId = lordOwner(state, targetLordId)?.id ?? "";
  let best: GameState = state;
  let bestValue = Number.NEGATIVE_INFINITY;
  for (const position of getValidGiantPositionsUseCase(state, targetLordId)) {
    const next = simulated(placeGiantUseCase(state, targetLordId, position));
    if (!next) continue;
    const value = evaluateState(next, targetId, { opponentWeight: 0 });
    if (value > bestValue) {
      bestValue = value;
      best = next;
    }
  }
  return best;
};

/**
 * Best giant to send and opponent to receive it: the crown freed in the own
 * kingdom against the crown the opponent will have to cover.
 */
export const bestGiantToSend = (
  context: SendGiantContext,
  profile: EvaluationProfile,
): SendGiantChoice | null =>
  pickBest(
    context,
    context.targets.giantIndexes.flatMap((giantIndex) =>
      context.targets.targetPlayerIds.map((targetPlayerId) => ({
        giantIndex,
        targetPlayerId,
      })),
    ),
    (choice) => {
      const state = simulated(
        sendGiantUseCase(
          context.game,
          context.lordId,
          choice.giantIndex,
          choice.targetPlayerId,
        ),
      );
      return state ? resolvePendingGiant(state) : null;
    },
    profile,
  );

// ─── Seeded random choices ──────────────────────────────────────────

/**
 * Deterministic random generator for one decision: derived from the game seed
 * (or id) and the decision point, so a game replayed with the same seed gets
 * the same "random" bot decisions.
 */
export const decisionRandom = (
  game: GameWithNextAction,
  salt: string,
): (() => number) =>
  createSeededRandom(
    game.seed ?? game.id,
    [
      "bot",
      game.turn,
      game.nextAction.nextLord,
      game.nextAction.nextAction,
      game.dominoes.length,
      game.currentDominoes.filter((d) => d.picked).length,
      game.ageOfGiants?.pendingGiant?.fromLordId ?? "",
      salt,
    ].join("|"),
  );

/** Uniform pick, or undefined for an empty list. */
export const randomItem = <T>(
  random: () => number,
  items: readonly T[],
): T | undefined => items[Math.floor(random() * items.length)];

/**
 * Seeded uniform choice among the valid targets, "skip" (null) counting as
 * one more option when allowed.
 */
export const randomChoice = <T>(
  context: ExtensionContext,
  choices: T[],
  salt: string,
): T | null => {
  const random = decisionRandom(context.game, salt);
  const options: (T | null)[] = context.canSkip ? [null, ...choices] : choices;
  return randomItem(random, options) ?? null;
};
