import {
  createEmptyKingdom,
  placeCastle,
} from "@core/domain/entities/kingdom.js";
import { createPlayer } from "@core/domain/entities/player.js";
import type { Game, NextStep, Players } from "@core/domain/types/index.js";
import type { RuleRepository } from "@core/portServerside/ruleRepository.js";
import type { ShuffleMethod } from "@core/portServerside/shuffleMethod.js";
import type { UuidMethod } from "@core/portServerside/uuidMethod.js";
import { err, isErr, ok, type Result } from "@utils/result.js";

export type AddPlayersUseCase = (
  game: Game & { nextAction: NextStep },
  players: string[]
) => Result<Game & { nextAction: NextStep }>;

export const addPlayersUseCase =
  (deps: {
    uuidMethod: UuidMethod;
    shuffleMethod: ShuffleMethod;
    ruleRepository: RuleRepository;
  }): AddPlayersUseCase =>
  (game, players) => {
    const { uuidMethod, shuffleMethod, ruleRepository } = deps;

    if (!players || players.length < 2 || players.length > 4) {
      return err("Invalid number of players");
    }

    const newPlayers: Players = [];

    for (const player of players) {
      let kingdom = createEmptyKingdom();
      kingdom = placeCastle(kingdom);
      let id = uuidMethod();
      const newPlayer = createPlayer(player, id, kingdom);

      if (isErr(newPlayer)) {
        return newPlayer;
      }

      newPlayers.push(newPlayer.value);
    }

    // set rules
    const rules = ruleRepository.getAll();
    const basicRules = rules.basic[newPlayers.length];

    if (!basicRules) {
      return err("No base rules found");
    }

    // updateDominoes
    const dominoes = game.dominoes;
    const { maxDominoes } = basicRules;
    const shuffledDominoes = shuffleMethod(dominoes);
    const splicedDominoes = shuffledDominoes.slice(0, maxDominoes);
    const next: NextStep = {
      type: "step",
      step: "options",
    };

    const updatedGame: Game & { nextAction: NextStep } = {
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
