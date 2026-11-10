import {
  destroyWithDragon,
  isValidConstructionPosition,
  purchaseBuilding,
} from "@core/domain/entities/building.js";
import {
  getRecruitmentCost,
  isValidCavemanPosition,
  type RecruitmentCost,
} from "@core/domain/entities/caveman.js";
import { getValidFireTokenPositions } from "@core/domain/entities/fireToken.js";
import {
  hasGiantAtIndex,
  placeGiantOnCrown,
} from "@core/domain/entities/giant.js";
import { canPlaceKnight } from "@core/domain/entities/knight.js";
import { getValidResourcePayments } from "@core/domain/entities/resource.js";
import type { BuildingTile } from "@core/domain/types/building.js";
import {
  type GameState,
  type GameWithNextAction,
  isGameWithNextAction,
} from "@core/domain/types/game.js";
import type { Kingdom, Position } from "@core/domain/types/kingdom.js";
import {
  type PlayerActions,
  playerActions,
} from "@core/domain/types/player.js";
import { isErr, isOk } from "@utils/result.js";
import { resolveConstruction } from "./constructBuilding.js";
import { resolveFireTokenPlacement } from "./placeFireToken.js";
import { resolveGiantPlacement } from "./placeGiant.js";
import { resolveKnightPlacement } from "./placeKnight.js";
import { resolveRecruitment } from "./recruitCaveman.js";
import { resolveGiantSender, resolveGiantTarget } from "./sendGiant.js";
import { resolveSkip } from "./skipOptionalAction.js";
import { resolveDragon } from "./useDragon.js";

/*
 * Valid targets of the extension actions (Queendomino, Origins, Age of Giants).
 *
 * Each query reuses the checks of the matching use case (its `resolve*`
 * function) and the very predicate that use case applies to its target, then
 * keeps every candidate that predicate accepts. A target returned here is
 * therefore accepted by the action, and a target left out is refused by it.
 *
 * Every query takes any game state and an optional lord (default: the lord who
 * must play) and answers empty (`[]`, `false`) when the action does not apply.
 */

/**
 * A caveman of the cave board that can be recruited now, with every valid way
 * to pay for it (Origins Tribe).
 */
export type CavemanRecruitmentOption = {
  /** Caveman to pass as `cavemanId` to `recruitCaveman` */
  cavemanId: number;
  /** Visible caveman (2 different resources) or draw pile (4 different) */
  source: RecruitmentCost["source"];
  /** Every valid `resourcePositions` payment for this caveman */
  resourceCombinations: Position[][];
};

/**
 * Valid `recruitCaveman` arguments: any option, any of its resource
 * combinations and any position can be combined. Both lists are empty when
 * no recruitment is possible.
 */
export type ValidCavemanPlacements = {
  /** Recruitable cavemen with their valid payments */
  options: CavemanRecruitmentOption[];
  /** Squares where the recruited caveman can be placed */
  positions: Position[];
};

/**
 * Valid `sendGiant` arguments: any giant index can be sent to any target
 * player. Both lists are empty when no giant can be sent. The crown covered is
 * chosen by the targeted opponent (see `getValidGiantPositions`).
 */
export type ValidGiantTargets = {
  /** Indexes in the sender's `giants` array that can be sent */
  giantIndexes: number[];
  /** Opponents that can receive a giant */
  targetPlayerIds: string[];
};

/** Signature shared by the valid-target queries. */
export type ValidActionTargetsUseCase<T> = (
  game: GameState,
  lordId?: string,
) => T;

type LordTurn = { game: GameWithNextAction; lordId: string };

/**
 * The game and lord to check when `action` is the action the game waits for
 * (the same gate as the action's handler), or null otherwise.
 */
const turnFor = (
  game: GameState,
  action: PlayerActions,
  lordId: string | undefined,
): LordTurn | null => {
  if (!isGameWithNextAction(game) || game.nextAction.nextAction !== action) {
    return null;
  }
  return { game, lordId: lordId ?? game.nextAction.nextLord };
};

/** Every square of a kingdom grid, row by row. */
const kingdomPositions = (kingdom: Kingdom): Position[] =>
  kingdom.flatMap((row, y) => row.map((_, x) => ({ x, y })));

/**
 * Squares where `placeFireToken` accepts the pending fire token (Origins).
 */
export const getValidFireTokenPositionsUseCase: ValidActionTargetsUseCase<
  Position[]
> = (game, lordId) => {
  const turn = turnFor(game, playerActions.placeFireToken, lordId);
  if (!turn) return [];

  const context = resolveFireTokenPlacement(turn.game, turn.lordId);
  if (isErr(context)) return [];

  const { player, pending, existingTokens } = context.value;
  return getValidFireTokenPositions(
    player.kingdom,
    pending.volcanoPosition,
    pending.fires,
    existingTokens,
  );
};

/**
 * Squares where `placeKnight` accepts a knight: squares of the domino just
 * placed that hold no knight yet, while the player still has a knight
 * available (Queendomino).
 */
export const getValidKnightPositionsUseCase: ValidActionTargetsUseCase<
  Position[]
> = (game, lordId) => {
  const turn = turnFor(game, playerActions.placeKnight, lordId);
  if (!turn) return [];

  const context = resolveKnightPlacement(turn.game, turn.lordId);
  if (isErr(context)) return [];

  const { player, allowedPositions } = context.value;
  return kingdomPositions(player.kingdom).filter((position) =>
    canPlaceKnight(player, player.kingdom, position, allowedPositions),
  );
};

type ConstructionOptions = { positions: Position[]; buildings: BuildingTile[] };

const noConstruction = (): ConstructionOptions => ({
  positions: [],
  buildings: [],
});

const getConstructionOptions = (
  game: GameState,
  lordId: string | undefined,
): ConstructionOptions => {
  const turn = turnFor(game, playerActions.constructBuilding, lordId);
  if (!turn) return noConstruction();

  const context = resolveConstruction(turn.game, turn.lordId);
  if (isErr(context)) return noConstruction();

  const { player, queendomino } = context.value;
  const board = queendomino.buildersBoard;

  const positions = kingdomPositions(player.kingdom).filter((position) =>
    isValidConstructionPosition(
      player.kingdom,
      player.buildings ?? [],
      position,
    ),
  );
  const buildings = board.slots.filter(
    (slot): slot is BuildingTile =>
      slot !== null &&
      purchaseBuilding(board, player, slot.id, queendomino.queenHolderId) !==
        null,
  );

  // A construction needs both a free construction square and a building
  if (positions.length === 0 || buildings.length === 0) return noConstruction();
  return { positions, buildings };
};

/**
 * Construction squares where `constructBuilding` succeeds with any building of
 * `getAffordableBuildings` (Queendomino). Empty when no building can be bought.
 */
export const getValidBuildingPositionsUseCase: ValidActionTargetsUseCase<
  Position[]
> = (game, lordId) => getConstructionOptions(game, lordId).positions;

/**
 * Buildings of the Builders Board that `constructBuilding` accepts (the player
 * can pay the price of their spot, minus the Queen's discount for her host),
 * on any square of `getValidBuildingPositions` (Queendomino). Empty when no
 * construction square is free.
 */
export const getAffordableBuildingsUseCase: ValidActionTargetsUseCase<
  BuildingTile[]
> = (game, lordId) => getConstructionOptions(game, lordId).buildings;

/**
 * Buildings of the Builders Board that `useDragon` accepts to burn: every
 * building still on the board when the Dragon is in its cave, the lord does
 * not host the Queen and can pay its 1 coin (Queendomino). Empty otherwise.
 */
export const getValidDragonTargetsUseCase: ValidActionTargetsUseCase<
  BuildingTile[]
> = (game, lordId) => {
  const turn = turnFor(game, playerActions.useDragon, lordId);
  if (!turn) return [];

  const context = resolveDragon(turn.game, turn.lordId);
  if (isErr(context)) return [];

  const { player, queendomino } = context.value;
  const board = queendomino.buildersBoard;
  return board.slots.filter(
    (slot): slot is BuildingTile =>
      slot !== null && destroyWithDragon(board, slot.id, player) !== null,
  );
};

const noRecruitment = (): ValidCavemanPlacements => ({
  options: [],
  positions: [],
});

/**
 * Valid `recruitCaveman` arguments: recruitable cavemen with every valid
 * payment, and the squares where the caveman can be placed (Origins Tribe).
 */
export const getValidCavemanPlacementsUseCase: ValidActionTargetsUseCase<
  ValidCavemanPlacements
> = (game, lordId) => {
  const turn = turnFor(game, playerActions.recruitCaveman, lordId);
  if (!turn) return noRecruitment();

  const context = resolveRecruitment(turn.game, turn.lordId);
  if (isErr(context)) return noRecruitment();

  const { player, caveBoard, resources, fireTokens, cavemen } = context.value;

  const positions = kingdomPositions(player.kingdom).filter((position) =>
    isValidCavemanPosition(
      player.kingdom,
      position,
      fireTokens,
      resources,
      cavemen,
    ),
  );
  if (positions.length === 0) return noRecruitment();

  // Payments only depend on the cost, shared by every caveman of a source
  const paymentsByCost = new Map<string, Position[][]>();
  const paymentsFor = (cost: RecruitmentCost): Position[][] => {
    const key = `${cost.resourceCount}/${cost.differentTypes}`;
    let payments = paymentsByCost.get(key);
    if (!payments) {
      payments = getValidResourcePayments(
        resources,
        cost.resourceCount,
        cost.differentTypes,
      );
      paymentsByCost.set(key, payments);
    }
    return payments;
  };

  const options: CavemanRecruitmentOption[] = [];
  for (const caveman of [...caveBoard.visible, ...caveBoard.drawPile]) {
    const cost = getRecruitmentCost(caveBoard, caveman.id);
    if (!cost) continue;
    const resourceCombinations = paymentsFor(cost);
    if (resourceCombinations.length > 0) {
      options.push({
        cavemanId: caveman.id,
        source: cost.source,
        resourceCombinations,
      });
    }
  }

  if (options.length === 0) return noRecruitment();
  return { options, positions };
};

/**
 * Crowns where `placeGiant` accepts the giant (Age of Giants). When a giant
 * was sent by an opponent (`ageOfGiants.pendingGiant`), these are the crowns
 * of the targeted player, who is the lord to play.
 */
export const getValidGiantPositionsUseCase: ValidActionTargetsUseCase<
  Position[]
> = (game, lordId) => {
  const turn = turnFor(game, playerActions.placeGiant, lordId);
  if (!turn) return [];

  const context = resolveGiantPlacement(turn.game, turn.lordId);
  if (isErr(context)) return [];

  const { player } = context.value;
  return kingdomPositions(player.kingdom).filter((position) =>
    isOk(placeGiantOnCrown(player, position)),
  );
};

const noGiantTarget = (): ValidGiantTargets => ({
  giantIndexes: [],
  targetPlayerIds: [],
});

/**
 * Valid `sendGiant` arguments: the giants the lord can send and the opponents
 * that can receive one (Age of Giants).
 */
export const getValidGiantTargetsUseCase: ValidActionTargetsUseCase<
  ValidGiantTargets
> = (game, lordId) => {
  const turn = turnFor(game, playerActions.sendGiant, lordId);
  if (!turn) return noGiantTarget();

  const sender = resolveGiantSender(turn.game, turn.lordId);
  if (isErr(sender)) return noGiantTarget();

  const source = sender.value;
  const giantIndexes = (source.giants ?? [])
    .map((_, index) => index)
    .filter((index) => hasGiantAtIndex(source, index));
  const targetPlayerIds = turn.game.players
    .filter((player) => isOk(resolveGiantTarget(turn.game, source, player.id)))
    .map((player) => player.id);

  if (giantIndexes.length === 0 || targetPlayerIds.length === 0) {
    return noGiantTarget();
  }
  return { giantIndexes, targetPlayerIds };
};

/**
 * Whether `skipOptionalAction` accepts to skip the current action for the lord
 * (false for `placeGiant`, which is mandatory, and for non-optional actions).
 */
export const canSkipOptionalActionUseCase: ValidActionTargetsUseCase<
  boolean
> = (game, lordId) =>
  isGameWithNextAction(game) &&
  isOk(resolveSkip(game, lordId ?? game.nextAction.nextLord));
