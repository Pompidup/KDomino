import type { Game, NextStep, Players } from "../domain/types/index.js";
import type { UuidMethod } from "../portServerside/uuidMethod.js";
import type { ShuffleMethod } from "../portServerside/shuffleMethod.js";
import { ok, err, type Result, isErr } from "../../utils/result.js";
import { createPlayer } from "../domain/entities/player.js";
import { createEmptyKingdom, placeCastle } from "../domain/entities/kingdom.js";
import type { RuleRepository } from "../portServerside/ruleRepository.js";

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
