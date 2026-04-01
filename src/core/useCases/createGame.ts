import { create } from "@core/domain/entities/game.js";
import { createMode } from "@core/domain/entities/mode.js";
import { isTribeMode } from "@core/domain/entities/originsHelpers.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type { BuildingTile } from "@core/domain/types/building.js";
import type { GameWithNextStep } from "@core/domain/types/game.js";
import type { CavemanTile } from "@core/domain/types/origins.js";
import type { BuildingsRepository } from "@core/portServerside/buildingsRepository.js";
import type { CavemenRepository } from "@core/portServerside/cavemenRepository.js";
import type { DominoesRepository } from "@core/portServerside/dominoesRepository.js";
import type { ModeRepository } from "@core/portServerside/modeRepository.js";
import type { UuidMethod } from "@core/portServerside/uuidMethod.js";
import { err, isErr, ok, type Result } from "@utils/result.js";

export type CreateGameUseCase = (
  mode: string,
  seed?: string,
) => Result<GameWithNextStep>;

export const createGameUseCase =
  (deps: {
    modeRepository: ModeRepository;
    dominoesRepository: DominoesRepository;
    uuidMethod: UuidMethod;
    buildingsRepository?: BuildingsRepository;
    cavemenRepository?: CavemenRepository;
  }): CreateGameUseCase =>
  (mode, seed) => {
    const { modeRepository, dominoesRepository, uuidMethod, buildingsRepository, cavemenRepository } = deps;
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

    const isQueenDomino = newMode.value.name === "QueenDomino";
    let buildings: BuildingTile[] | undefined;

    if (isQueenDomino && buildingsRepository) {
      buildings = buildingsRepository.getAll();
    }

    let cavemen: CavemanTile[] | undefined;
    if (isTribeMode(newMode.value.name) && cavemenRepository) {
      cavemen = cavemenRepository.getAll();
    }

    const payload = {
      id,
      mode: newMode.value,
      dominoes,
      seed: gameSeed,
      buildings,
      cavemen,
    };

    const newGame = create(payload);

    return ok(newGame);
  };
