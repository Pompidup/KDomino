import type { PlayerInput } from "@application/commands/addPlayersCommand.js";
import {
  isAgeOfGiantsMode,
  isAgeOfGiantsQueenDominoMode,
} from "@core/domain/entities/ageOfGiantsHelpers.js";
import { STARTING_COINS } from "@core/domain/entities/economy.js";
import {
  createEmptyKingdom,
  placeCastle,
} from "@core/domain/entities/kingdom.js";
import {
  isOriginsMode,
  isResourceMode,
  isTribeMode,
} from "@core/domain/entities/originsHelpers.js";
import { createPlayer } from "@core/domain/entities/player.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type {
  GameWithNextStep,
  NextStep,
  Players,
} from "@core/domain/types/index.js";
import type { RuleRepository } from "@core/portServerside/ruleRepository.js";
import type { ShuffleMethod } from "@core/portServerside/shuffleMethod.js";
import type { UuidMethod } from "@core/portServerside/uuidMethod.js";
import { err, isErr, ok, type Result } from "@utils/result.js";
import { createSeededShuffle } from "@utils/seededShuffle.js";

export type AddPlayersUseCase = (
  game: GameWithNextStep,
  players: PlayerInput[],
) => Result<GameWithNextStep>;

const normalizePlayerInput = (
  input: PlayerInput,
): { id?: string; name: string; bot?: { strategyName: string } } => {
  if (typeof input === "string") {
    return { name: input };
  }
  return { id: input.id, name: input.name, bot: input.bot };
};

/**
 * Caller-provided ids must be non-empty strings, unique within the call.
 */
const hasValidPlayerIds = (players: PlayerInput[]): boolean => {
  const seen = new Set<string>();
  for (const player of players) {
    if (typeof player === "string" || player.id === undefined) continue;
    if (typeof player.id !== "string" || player.id.trim().length === 0) {
      return false;
    }
    if (seen.has(player.id)) return false;
    seen.add(player.id);
  }
  return true;
};

export const addPlayersUseCase =
  (deps: {
    uuidMethod: UuidMethod;
    shuffleMethod: ShuffleMethod;
    ruleRepository: RuleRepository;
  }): AddPlayersUseCase =>
  (game, players) => {
    const { uuidMethod, shuffleMethod, ruleRepository } = deps;

    const isAoG = isAgeOfGiantsMode(game.mode.name);
    const maxPlayers = isAoG ? 5 : 4;
    const minPlayers = isAoG ? 2 : 1;

    if (
      !players ||
      players.length < minPlayers ||
      players.length > maxPlayers
    ) {
      return err(ErrorCode.INVALID_PLAYER_COUNT);
    }

    if (!hasValidPlayerIds(players)) {
      return err(ErrorCode.INVALID_PLAYER_ID);
    }

    const newPlayers: Players = [];

    for (const player of players) {
      const { id: providedId, name, bot } = normalizePlayerInput(player);
      let kingdom = createEmptyKingdom();
      kingdom = placeCastle(kingdom);
      const id = providedId ?? uuidMethod();
      const newPlayer = createPlayer(name, id, kingdom, bot);

      if (isErr(newPlayer)) {
        return newPlayer;
      }

      // Initialize Queendomino-specific player state
      if (game.mode.name === "QueenDomino") {
        newPlayer.value.coins = STARTING_COINS;
        newPlayer.value.towers = 0;
        newPlayer.value.knights = [];
        newPlayer.value.buildings = [];
      }

      // Initialize Age of Giants-specific player state
      if (isAoG) {
        newPlayer.value.giants = [];
        // AoG-QueenDomino also needs Queendomino player state
        if (isAgeOfGiantsQueenDominoMode(game.mode.name)) {
          newPlayer.value.coins = STARTING_COINS;
          newPlayer.value.towers = 0;
          newPlayer.value.knights = [];
          newPlayer.value.buildings = [];
        }
      }

      // Initialize Origins-specific player state
      if (isOriginsMode(game.mode.name)) {
        newPlayer.value.fireTokens = [];
        if (isResourceMode(game.mode.name)) {
          newPlayer.value.resources = [];
        }
        if (isTribeMode(game.mode.name)) {
          newPlayer.value.cavemen = [];
        }
      }

      newPlayers.push(newPlayer.value);
    }

    // set rules
    const rules = ruleRepository.getAll();
    // Mode-specific setup first (e.g. Queendomino at 2 players: 7x7 kingdom
    // with every domino), then the Age of Giants or common setup
    const basicRules =
      rules.modeBasic?.[game.mode.name]?.[newPlayers.length] ??
      (isAoG && rules.aogBasic
        ? rules.aogBasic[newPlayers.length]
        : rules.basic[newPlayers.length]);

    if (!basicRules) {
      return err(ErrorCode.STEP_EXECUTION_FAILED);
    }

    // updateDominoes
    const dominoes = game.dominoes;
    const { maxDominoes } = basicRules;
    const shuffle = game.seed
      ? createSeededShuffle(game.seed, "dominoes")
      : shuffleMethod;
    const shuffledDominoes = shuffle(dominoes);
    const splicedDominoes = shuffledDominoes.slice(0, maxDominoes);
    const next: NextStep = {
      type: "step",
      step: "options",
    };

    const updatedGame: GameWithNextStep = {
      ...game,
      players: newPlayers,
      dominoes: splicedDominoes,
      rules: {
        ...game.rules,
        basic: basicRules,
      },
      nextAction: next,
    };

    return ok(updatedGame);
  };
