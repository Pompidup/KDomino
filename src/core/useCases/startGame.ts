import type { UuidMethod } from "../portServerside/uuidMethod.js";
import { ok, type Result } from "../../utils/result.js";
import type { Game, NextAction, NextStep } from "../domain/types/game.js";
import type { ShuffleMethod } from "../portServerside/shuffleMethod.js";
import type { Lord } from "../domain/types/lord.js";
import { createLord } from "../domain/entities/lord";
import { playerActions } from "../domain/types/player.js";

export type StartGameUseCase = (
  game: Game & { nextAction: NextStep }
) => Result<Game & { nextAction: NextAction }>;

export const startGameUseCase =
  (deps: {
    uuidMethod: UuidMethod;
    shuffleMethod: ShuffleMethod;
  }): StartGameUseCase =>
  (game) => {
    const { uuidMethod, shuffleMethod } = deps;
    const {
      rules: {
        basic: { lords: maxLords, dominoesPerTurn },
      },
      players,
      dominoes,
    } = game;

    const numberOfPlayers = players.length;

    const newLords: Lord[] = [];

    for (let i = 0; i < numberOfPlayers; i++) {
      for (let j = 0; j < maxLords; j++) {
        const lord = createLord(uuidMethod(), players[i]!.id);
        newLords.push(lord);
      }
    }

    const shuffledLords = shuffleMethod(newLords);
    const dominoesCopy = [...dominoes];
    const dominoesDrawn = dominoesCopy.splice(0, dominoesPerTurn);
    dominoesDrawn.sort((a, b) => a.number - b.number);
    const nextAction: NextAction = {
      type: "action",
      nextLord: shuffledLords[0]!.id,
      nextAction: playerActions.pickDomino,
    };

    const newState: Game & { nextAction: NextAction } = {
      ...game,
      lords: shuffledLords,
      nextAction,
      dominoes: dominoesCopy,
      currentDominoes: dominoesDrawn.map((domino, index) => {
        return {
          domino,
          picked: false,
          lordId: null,
          position: index + 1,
        };
      }),
    };

    return ok(newState);
  };