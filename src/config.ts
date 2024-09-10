import jsonDominoes from "@adapter/jsonDominoes.js";
import jsonModes from "@adapter/jsonModes.js";
import jsonRules from "@adapter/jsonRules.js";
import { shuffleMethod } from "@adapter/shuffle.js";
import { uuidMethod } from "@adapter/uuid.js";
import { winstonLogger } from "@adapter/winstonLogger.js";
import { addExtraRulesHandler } from "@application/handlers/addExtraRulesHandler.js";
import { addPlayersHandler } from "@application/handlers/addPlayersHandler.js";
import { chooseDominoHandler } from "@application/handlers/chooseDominoHandler.js";
import { createGameHandler } from "@application/handlers/createGameHandler.js";
import { discardDominoHandler } from "@application/handlers/discardDominoHandler.js";
import { getExtraRulesHandler } from "@application/handlers/getExtraRulesHandler.js";
import { getModesHandler } from "@application/handlers/getModesHandler.js";
import { getResultHandler } from "@application/handlers/getResultHandler.js";
import { placeDominoHandler } from "@application/handlers/placeDominoHandler.js";
import { startGameHandler } from "@application/handlers/startGameHandler.js";
import { calculateScoreHandler } from "@application/handlers/calculateScoreHandler.js";
import type { ShuffleMethod } from "@core/portServerside/shuffleMethod.js";
import type { UuidMethod } from "@core/portServerside/uuidMethod.js";
import { addExtraRulesUseCase } from "@core/useCases/addExtraRules.js";
import { addPlayersUseCase } from "@core/useCases/addPlayers.js";
import { chooseDominoUseCase } from "@core/useCases/chooseDomino.js";
import { createGameUseCase } from "@core/useCases/createGame.js";
import { discardDominoUseCase } from "@core/useCases/discardDomino.js";
import { getExtraRulesUseCase } from "@core/useCases/getExtraRules.js";
import { getModesUseCase } from "@core/useCases/getModes.js";
import { getResultUseCase } from "@core/useCases/getResult.js";
import { placeDominoUseCase } from "@core/useCases/placeDomino.js";
import { startGameUseCase } from "@core/useCases/startGame.js";
import { calculateScoreUseCase } from "@core/useCases/calculateScore.js";

export type EngineConfig = {
  uuidMethod?: UuidMethod;
  shuffleMethod?: ShuffleMethod;
  logging?: boolean;
};

export const configureEngine = (config: Partial<EngineConfig>) => {
  const modeRepository = jsonModes();
  const dominoesRepository = jsonDominoes();
  const ruleRepository = jsonRules();
  const uuid = config.uuidMethod || uuidMethod;
  const shuffle = config.shuffleMethod || shuffleMethod;
  const logger = config.logging ? winstonLogger(true) : winstonLogger(false);

  return {
    createGameHandler: createGameHandler(
      logger,
      createGameUseCase({
        modeRepository,
        dominoesRepository,
        uuidMethod: uuid,
      })
    ),
    getModesHandler: getModesHandler(
      logger,
      getModesUseCase({ modeRepository })
    ),
    getExtraRulesHandler: getExtraRulesHandler(
      logger,
      getExtraRulesUseCase({ ruleRepository })
    ),
    addPlayersHandler: addPlayersHandler(
      logger,
      addPlayersUseCase({
        uuidMethod: uuid,
        shuffleMethod: shuffle,
        ruleRepository,
      })
    ),
    addExtraRulesHandler: addExtraRulesHandler(
      logger,
      addExtraRulesUseCase({ ruleRepository })
    ),
    startGameHandler: startGameHandler(
      logger,
      startGameUseCase({ uuidMethod: uuid, shuffleMethod: shuffle })
    ),
    chooseDominoHandler: chooseDominoHandler(logger, chooseDominoUseCase),
    placeDominoHandler: placeDominoHandler(logger, placeDominoUseCase),
    discardDominoHandler: discardDominoHandler(logger, discardDominoUseCase),
    getResultHandler: getResultHandler(logger, {
      getResultUseCase,
      calculateScoreUseCase,
    }),
    calculateScoreHandler: calculateScoreHandler(logger, calculateScoreUseCase),
  };
};
