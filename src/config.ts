import jsonDominoes from "@adapter/jsonDominoes.js";
import jsonModes from "@adapter/jsonModes.js";
import jsonRules from "@adapter/jsonRules.js";
import { shuffleMethod } from "@adapter/shuffle.js";
import { uuidMethod } from "@adapter/uuid.js";
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
import type { DominoesRepository } from "@core/portServerside/dominoesRepository.js";
import type { ModeRepository } from "@core/portServerside/modeRepository.js";
import type { RuleRepository } from "@core/portServerside/ruleRepository.js";
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

export type EngineConfig = {
  modeRepository?: ModeRepository;
  dominoesRepository?: DominoesRepository;
  ruleRepository?: RuleRepository;
  uuidMethod?: UuidMethod;
  shuffleMethod?: ShuffleMethod;
};

export const configureEngine = (config: Partial<EngineConfig>) => {
  const modeRepository = config.modeRepository || jsonModes();
  const dominoesRepository = config.dominoesRepository || jsonDominoes();
  const ruleRepository = config.ruleRepository || jsonRules();
  const uuid = config.uuidMethod || uuidMethod;
  const shuffle = config.shuffleMethod || shuffleMethod;

  return {
    createGameHandler: createGameHandler(
      createGameUseCase({
        modeRepository,
        dominoesRepository,
        uuidMethod: uuid,
      })
    ),
    getModesHandler: getModesHandler(getModesUseCase({ modeRepository })),
    getExtraRulesHandler: getExtraRulesHandler(
      getExtraRulesUseCase({ ruleRepository })
    ),
    addPlayersHandler: addPlayersHandler(
      addPlayersUseCase({
        uuidMethod: uuid,
        shuffleMethod: shuffle,
        ruleRepository,
      })
    ),
    addExtraRulesHandler: addExtraRulesHandler(
      addExtraRulesUseCase({ ruleRepository })
    ),
    startGameHandler: startGameHandler(
      startGameUseCase({ uuidMethod: uuid, shuffleMethod: shuffle })
    ),
    chooseDominoHandler: chooseDominoHandler(chooseDominoUseCase),
    placeDominoHandler: placeDominoHandler(placeDominoUseCase),
    discardDominoHandler: discardDominoHandler(discardDominoUseCase),
    getResultHandler: getResultHandler(getResultUseCase),
  };
};
