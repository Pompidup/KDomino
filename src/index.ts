import type { GameEngine } from "./core/portUserside/engine.js";
import { configureEngine, type EngineConfig } from "./config.js";
import { isGameWithNextAction } from "./core/domain/types/game.js";

export const createGameEngine = (config: Partial<EngineConfig>): GameEngine => {
  const {
    createGameHandler,
    getModesHandler,
    getExtraRulesHandler,
    addPlayersHandler,
    addExtraRulesHandler,
    startGameHandler,
    chooseDominoHandler,
    placeDominoHandler,
    discardDominoHandler,
    getResultHandler,
  } = configureEngine(config);

  return {
    getModes: (command) => getModesHandler(command),
    getExtraRules: (command) => getExtraRulesHandler(command),
    createGame: (command) => createGameHandler(command),
    addPlayers: (command) => addPlayersHandler(command),
    addExtraRules: (command) => addExtraRulesHandler(command),
    startGame: (command) => startGameHandler(command),
    chooseDomino: (command) => chooseDominoHandler(command),
    placeDomino: (command) => placeDominoHandler(command),
    discardDomino: (command) => discardDominoHandler(command),
    getResults: (command) => getResultHandler(command),
  };
};

const engine = createGameEngine({});

const a = engine.createGame({ mode: "standard" });
const b = engine.getModes({});
const c = engine.getExtraRules({ mode: "standard", players: 2 });
const d = engine.addPlayers({ game: a, players: ["player1"] });
const e = engine.addExtraRules({ game: d, extraRules: ["rule1"] });
const f = engine.startGame({ game: e });
const g = engine.chooseDomino({
  game: f,
  lordId: "player1",
  dominoPick: 1,
});
const h = engine.discardDomino({ game: g, lordId: "player1" });
const i = engine.placeDomino({
  game: g,
  lordId: "player1",
  position: { x: 1, y: 1 },
  orientation: "horizontal",
  rotation: 0,
});
if (isGameWithNextAction(i)) {
  const j = engine.chooseDomino({
    game: i,
    lordId: "player1",
    dominoPick: 1,
  });
}

if (!isGameWithNextAction(i)) {
  const j = engine.getResults({ game: i });
}
