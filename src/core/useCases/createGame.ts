import { isAgeOfGiantsMode, isAgeOfGiantsQueenDominoMode } from "@core/domain/entities/ageOfGiantsHelpers.js";
import { create } from "@core/domain/entities/game.js";
import { createMode } from "@core/domain/entities/mode.js";
import { isTribeMode } from "@core/domain/entities/originsHelpers.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type { QuestTile } from "@core/domain/types/ageOfGiants.js";
import type { BuildingTile } from "@core/domain/types/building.js";
import type { GameWithNextStep } from "@core/domain/types/game.js";
import type { CavemanTile } from "@core/domain/types/origins.js";
import type { BuildingsRepository } from "@core/portServerside/buildingsRepository.js";
import type { CavemenRepository } from "@core/portServerside/cavemenRepository.js";
import type { DominoesRepository } from "@core/portServerside/dominoesRepository.js";
import type { ModeRepository } from "@core/portServerside/modeRepository.js";
import type { QuestTilesRepository } from "@core/portServerside/questTilesRepository.js";
import type { ShuffleMethod } from "@core/portServerside/shuffleMethod.js";
import type { UuidMethod } from "@core/portServerside/uuidMethod.js";
import { err, isErr, ok, type Result } from "@utils/result.js";
import { createSeededShuffle } from "@utils/seededShuffle.js";

export type CreateGameUseCase = (
  mode: string,
  seed?: string,
) => Result<GameWithNextStep>;

export const createGameUseCase =
  (deps: {
    modeRepository: ModeRepository;
    dominoesRepository: DominoesRepository;
    uuidMethod: UuidMethod;
    shuffleMethod: ShuffleMethod;
    buildingsRepository?: BuildingsRepository;
    cavemenRepository?: CavemenRepository;
    questTilesRepository?: QuestTilesRepository;
  }): CreateGameUseCase =>
  (mode, seed) => {
    const { modeRepository, dominoesRepository, uuidMethod, shuffleMethod, buildingsRepository, cavemenRepository, questTilesRepository } = deps;
    const id = uuidMethod();
    const gameSeed = seed ?? uuidMethod();
    const availableMode = modeRepository.getAvailables();
    const newMode = createMode(mode, availableMode);

    if (isErr(newMode)) {
      return newMode;
    }

    const dominoes = dominoesRepository.getForMode(newMode.value);

    if (!dominoes || dominoes.length === 0) {
      return err(ErrorCode.DOMINO_NOT_FOUND);
    }

    const isQueenDomino = newMode.value.name === "QueenDomino" || isAgeOfGiantsQueenDominoMode(newMode.value.name);
    let buildings: BuildingTile[] | undefined;

    if (isQueenDomino && buildingsRepository) {
      buildings = buildingsRepository.getAll();
    }

    let cavemen: CavemanTile[] | undefined;
    if (isTribeMode(newMode.value.name) && cavemenRepository) {
      cavemen = cavemenRepository.getAll();
    }

    let questTiles: QuestTile[] | undefined;
    if (isAgeOfGiantsMode(newMode.value.name) && questTilesRepository) {
      const allQuests = questTilesRepository.getAll();
      // Draw 2 random quest tiles
      const questShuffle = gameSeed
        ? createSeededShuffle(gameSeed, "quests")
        : shuffleMethod;
      const shuffledQuests = questShuffle(allQuests);
      questTiles = shuffledQuests.slice(0, 2);
    }

    const payload = {
      id,
      mode: newMode.value,
      dominoes,
      seed: gameSeed,
      buildings,
      cavemen,
      questTiles,
    };

    const newGame = create(payload);

    return ok(newGame);
  };
