import type {
  Game,
  NextAction,
  NextStep,
} from "../../core/domain/types/game.js";
import { createDominoesBuilder } from "./domino.js";
import { createLordBuilder } from "./lord.js";
import { createPlayerBuilder } from "./player.js";

const defaultPlayers: Game["players"] = [
  { id: "player1-id", name: "player1" },
  { id: "player2-id", name: "player2" },
].map((player) =>
  createPlayerBuilder().withId(player.id).withName(player.name).build()
);
const defaultLords: Game["lords"] = [
  {
    id: "lord1-id",
    playerId: "player1-id",
    turnEnded: false,
    hasPick: false,
    hasPlace: false,
  },
  {
    id: "lord2-id",
    playerId: "player1-id",
    turnEnded: false,
    hasPick: false,
    hasPlace: false,
  },
  {
    id: "lord3-id",
    playerId: "player2-id",
    turnEnded: false,
    hasPick: false,
    hasPlace: false,
  },
  {
    id: "lord4-id",
    playerId: "player2-id",
    turnEnded: false,
    hasPick: false,
    hasPlace: false,
  },
].map((lord) =>
  createLordBuilder()
    .withId(lord.id)
    .withPlayerId(lord.playerId)
    .withTurnEnded(lord.turnEnded)
    .withHasPick(lord.hasPick)
    .withHasPlace(lord.hasPlace)
    .build()
);
const defaultGame: Game = {
  id: "default-id",
  dominoes: [],
  currentDominoes: [],
  players: [],
  lords: [],
  turn: 0,
  nextAction: {
    type: "action",
    nextLord: "default-lord-id",
    nextAction: "pickDomino",
  },
  rules: {
    basic: {
      lords: 2,
      maxDominoes: 24,
      dominoesPerTurn: 4,
      maxTurns: 6,
    },
    extra: [],
  },
  mode: {
    name: "Classic",
    description: "Classic mode",
  },
};

type GameBuilderNextAction<
  T extends NextAction | NextStep = NextAction | NextStep
> = Omit<Game, "nextAction"> & { nextAction: T };

export const createGameBuilder = <
  T extends NextAction | NextStep = NextAction | NextStep
>(
  game: Partial<GameBuilderNextAction<T>> = {}
) => ({
  withId: (id: string) => createGameBuilder<T>({ ...game, id }),
  withDominoes: (dominoes: Game["dominoes"]) =>
    createGameBuilder<T>({ ...game, dominoes }),
  withCurrentDominoes: (currentDominoes: Game["currentDominoes"]) =>
    createGameBuilder<T>({ ...game, currentDominoes }),
  withPlayers: (players: Game["players"]) =>
    createGameBuilder<T>({ ...game, players }),
  withLords: (lords: Game["lords"]) => createGameBuilder<T>({ ...game, lords }),
  withTurn: (turn: Game["turn"]) => createGameBuilder<T>({ ...game, turn }),
  withNextAction: <U extends NextAction | NextStep>(nextAction: U) =>
    createGameBuilder<U>({ ...game, nextAction } as GameBuilderNextAction<U>),
  withRules: (rules: Game["rules"]) => createGameBuilder<T>({ ...game, rules }),
  withMode: (mode: Game["mode"]) => createGameBuilder<T>({ ...game, mode }),
  withDefaultDominoes: () =>
    createGameBuilder<T>({
      ...game,
      dominoes: createDominoesBuilder().build(),
    }),
  withDefaultPlayers: () =>
    createGameBuilder<T>({ ...game, players: defaultPlayers }),
  withDefaultLords: () =>
    createGameBuilder<T>({ ...game, lords: defaultLords }),
  withAllDefaults: () =>
    createGameBuilder<T>({
      ...game,
      dominoes: createDominoesBuilder().build(),
      players: [...defaultPlayers],
      lords: defaultLords.map((lord) => ({ ...lord })),
    }),
  build: () =>
    ({
      ...JSON.parse(JSON.stringify(defaultGame)),
      ...JSON.parse(JSON.stringify(game)),
    } as GameBuilderNextAction<T>),
});
