import { isAgeOfGiantsQueenDominoMode } from "@core/domain/entities/ageOfGiantsHelpers.js";
import { createBuildersBoard } from "@core/domain/entities/building.js";
import { createCaveBoard } from "@core/domain/entities/caveman.js";
import { createLord } from "@core/domain/entities/lord";
import { isTribeMode } from "@core/domain/entities/originsHelpers.js";
import type {
  GameWithNextAction,
  GameWithNextStep,
  NextAction,
} from "@core/domain/types/game.js";
import type { Lord } from "@core/domain/types/lord.js";
import { playerActions } from "@core/domain/types/player.js";
import type { ShuffleMethod } from "@core/portServerside/shuffleMethod.js";
import type { UuidMethod } from "@core/portServerside/uuidMethod.js";
import { ok, type Result } from "@utils/result.js";
import { createSeededShuffle } from "@utils/seededShuffle.js";

export type StartGameUseCase = (
  game: GameWithNextStep
) => Result<GameWithNextAction>;

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

    const shuffle = game.seed
      ? createSeededShuffle(game.seed, "lords")
      : shuffleMethod;
    const shuffledLords = shuffle(newLords);
    const dominoesCopy = [...dominoes];
    const dominoesDrawn = dominoesCopy.splice(0, dominoesPerTurn);
    dominoesDrawn.sort((a, b) => a.number - b.number);

    // Age of Giants: discard some dominos from the sorted line before selection
    const discardCount = game.rules.basic.dominoesDiscardedPerTurn ?? 0;
    if (discardCount > 0) {
      dominoesDrawn.splice(0, discardCount);
    }

    const nextAction: NextAction = {
      type: "action",
      nextLord: shuffledLords[0]!.id,
      nextAction: playerActions.pickDomino,
    };

    // Setup Builders Board for QueenDomino mode (including AoG-QD)
    let queendomino = game.queendomino;
    if (queendomino && (game.mode.name === "QueenDomino" || isAgeOfGiantsQueenDominoMode(game.mode.name))) {
      const buildingShuffle = game.seed
        ? createSeededShuffle(game.seed, "buildings")
        : shuffleMethod;
      const board = createBuildersBoard(
        queendomino.buildersBoard.drawPile,
        buildingShuffle,
      );
      queendomino = { ...queendomino, buildersBoard: board };
    }

    // Setup Cave Board for Tribe mode
    let origins = game.origins;
    if (origins?.caveBoard && isTribeMode(game.mode.name)) {
      const caveShuffle = game.seed
        ? createSeededShuffle(game.seed, "cavemen")
        : shuffleMethod;
      const board = createCaveBoard(origins.caveBoard.drawPile, caveShuffle);
      origins = { ...origins, caveBoard: board };
    }

    const newState: GameWithNextAction = {
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
      ...(queendomino !== undefined && { queendomino }),
      ...(origins !== undefined && { origins }),
    };

    return ok(newState);
  };
