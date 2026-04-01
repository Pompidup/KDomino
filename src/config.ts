import { consoleLogger, silentLogger } from "@adapter/consoleLogger.js";
import jsonDominoes from "@adapter/jsonDominoes.js";
import jsonModes from "@adapter/jsonModes.js";
import jsonRules from "@adapter/jsonRules.js";
import { shuffleMethod } from "@adapter/shuffle.js";
import { uuidMethod } from "@adapter/uuid.js";
import { addExtraRulesHandler } from "@application/handlers/addExtraRulesHandler.js";
import { addPlayersHandler } from "@application/handlers/addPlayersHandler.js";
import { calculateScoreHandler } from "@application/handlers/calculateScoreHandler.js";
import { canPlaceDominoHandler } from "@application/handlers/canPlaceDominoHandler.js";
import { chooseDominoHandler } from "@application/handlers/chooseDominoHandler.js";
import { createGameHandler } from "@application/handlers/createGameHandler.js";
import { discardDominoHandler } from "@application/handlers/discardDominoHandler.js";
import { getDynastyResultHandler } from "@application/handlers/getDynastyResultHandler.js";
import { getExtraRulesHandler } from "@application/handlers/getExtraRulesHandler.js";
import { getModesHandler } from "@application/handlers/getModesHandler.js";
import { getResultHandler } from "@application/handlers/getResultHandler.js";
import { getValidPlacementsHandler } from "@application/handlers/getValidPlacementsHandler.js";
import { placeDominoHandler } from "@application/handlers/placeDominoHandler.js";
import {
  deserializeGameHandler,
  serializeGameHandler,
} from "@application/handlers/serializeGameHandler.js";
import { startGameHandler } from "@application/handlers/startGameHandler.js";
import type { Translator } from "@core/i18n/translations.js";
import { defaultTranslator } from "@core/i18n/translations.js";
import type { Logger } from "@core/portServerside/logger.js";
import type { ShuffleMethod } from "@core/portServerside/shuffleMethod.js";
import type { UuidMethod } from "@core/portServerside/uuidMethod.js";
import { addExtraRulesUseCase } from "@core/useCases/addExtraRules.js";
import { addPlayersUseCase } from "@core/useCases/addPlayers.js";
import { calculateScoreUseCase } from "@core/useCases/calculateScore.js";
import { chooseDominoUseCase } from "@core/useCases/chooseDomino.js";
import { createGameUseCase } from "@core/useCases/createGame.js";
import { discardDominoUseCase } from "@core/useCases/discardDomino.js";
import type { GameEventCallbacks } from "@core/useCases/gameEvents.js";
import { getDynastyResultUseCase } from "@core/useCases/getDynastyResult.js";
import { getExtraRulesUseCase } from "@core/useCases/getExtraRules.js";
import { getModesUseCase } from "@core/useCases/getModes.js";
import { getResultUseCase } from "@core/useCases/getResult.js";
import {
  canPlaceDominoUseCase,
  getValidPlacementsUseCase,
} from "@core/useCases/getValidPlacements.js";
import { placeDominoUseCase } from "@core/useCases/placeDomino.js";
import { startGameUseCase } from "@core/useCases/startGame.js";

/**
 * Configuration options for the game engine.
 */
export type EngineConfig = {
  /** Custom UUID generation method. Defaults to crypto.randomUUID() */
  uuidMethod?: UuidMethod;
  /** Custom shuffle method. Defaults to Fisher-Yates algorithm */
  shuffleMethod?: ShuffleMethod;
  /** Enable console logging. Defaults to false */
  logging?: boolean;
  /** Custom logger instance. When provided, takes precedence over 'logging' option */
  logger?: Logger;
  /** Optional event callbacks for UI/animation integration */
  events?: GameEventCallbacks;
  /** Custom translator for i18n error messages. Defaults to English */
  translator?: Translator;
};

export const configureEngine = (config: Partial<EngineConfig>) => {
  const modeRepository = jsonModes();
  const dominoesRepository = jsonDominoes();
  const ruleRepository = jsonRules();
  const uuid = config.uuidMethod || uuidMethod;
  const shuffle = config.shuffleMethod || shuffleMethod;
  const translator = config.translator || defaultTranslator;

  // Logger priority: custom logger > logging flag > silent
  const logger = config.logger
    ? config.logger
    : config.logging
      ? consoleLogger(true)
      : silentLogger;

  return {
    createGameHandler: createGameHandler(
      logger,
      translator,
      createGameUseCase({
        modeRepository,
        dominoesRepository,
        uuidMethod: uuid,
      }),
    ),
    getModesHandler: getModesHandler(
      logger,
      translator,
      getModesUseCase({ modeRepository }),
    ),
    getExtraRulesHandler: getExtraRulesHandler(
      logger,
      translator,
      getExtraRulesUseCase({ ruleRepository }),
    ),
    addPlayersHandler: addPlayersHandler(
      logger,
      translator,
      addPlayersUseCase({
        uuidMethod: uuid,
        shuffleMethod: shuffle,
        ruleRepository,
      }),
    ),
    addExtraRulesHandler: addExtraRulesHandler(
      logger,
      translator,
      addExtraRulesUseCase({
        ruleRepository,
        dominoesRepository,
        shuffleMethod: shuffle,
      }),
    ),
    startGameHandler: startGameHandler(
      logger,
      translator,
      startGameUseCase({ uuidMethod: uuid, shuffleMethod: shuffle }),
    ),
    chooseDominoHandler: chooseDominoHandler(
      logger,
      translator,
      chooseDominoUseCase,
    ),
    placeDominoHandler: placeDominoHandler(
      logger,
      translator,
      placeDominoUseCase,
    ),
    discardDominoHandler: discardDominoHandler(
      logger,
      translator,
      discardDominoUseCase,
    ),
    getResultHandler: getResultHandler(logger, translator, {
      getResultUseCase,
      calculateScoreUseCase,
    }),
    calculateScoreHandler: calculateScoreHandler(
      logger,
      translator,
      calculateScoreUseCase,
    ),
    getValidPlacementsHandler: getValidPlacementsHandler(
      logger,
      translator,
      getValidPlacementsUseCase,
    ),
    canPlaceDominoHandler: canPlaceDominoHandler(
      logger,
      translator,
      canPlaceDominoUseCase,
    ),
    serializeGameHandler: serializeGameHandler(logger, translator),
    deserializeGameHandler: deserializeGameHandler(logger, translator),
    getDynastyResultHandler: getDynastyResultHandler(
      logger,
      translator,
      getDynastyResultUseCase,
    ),
  };
};
