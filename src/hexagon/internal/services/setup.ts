import type { Game } from "../entities/game.js";
import type { Lord } from "../entities/lord.js";
import type { Player } from "../entities/player.js";
import kingdom from "../entities/kingdom.js";
import { type GameDependencies, rules } from "./game.js";

type SetupPayload = {
  state: Game;
  players: { name: string }[];
};

const setup =
  (dependencies: GameDependencies) =>
  (payload: SetupPayload): Game => {
    const { state, players } = payload;

    if (!players) {
      throw new Error("There must be at least 2 players");
    }

    if (players.length > 4) {
      throw new Error("There must be no more than 4 players");
    }

    if (players.length < 2) {
      throw new Error("There must be at least 2 players");
    }

    const { dominoes } = state;
    const { shuffleMethod, uuidMethod } = dependencies;
    const { maxDominoes, dominoesPerTurn, maxTurns } = rules[players.length]!;
    const shuffledDominoes = shuffleMethod(dominoes);
    shuffledDominoes.splice(maxDominoes);

    const newPlayers: Player[] = players.map((player) => {
      return {
        ...player,
        kingdom: kingdom.createKingdomWithCastle(),
        id: uuidMethod(),
      };
    });

    let newLords: Lord[];
    if (newPlayers.length === 2) {
      newLords = [
        {
          id: uuidMethod(),
          playerId: newPlayers[0]!.id!,
          order: 1,
          turnEnded: false,
          hasPick: false,
          hasPlace: false,
        },
        {
          id: uuidMethod(),
          playerId: newPlayers[0]!.id!,
          order: 2,
          turnEnded: false,
          hasPick: false,
          hasPlace: false,
        },
        {
          id: uuidMethod(),
          playerId: newPlayers[1]!.id!,
          order: 3,
          turnEnded: false,
          hasPick: false,
          hasPlace: false,
        },
        {
          id: uuidMethod(),
          playerId: newPlayers[1]!.id!,
          order: 4,
          turnEnded: false,
          hasPick: false,
          hasPlace: false,
        },
      ];
    } else {
      newLords = newPlayers.map((player, index) => {
        return {
          id: uuidMethod(),
          playerId: player.id!,
          order: index + 1,
          turnEnded: false,
          hasPick: false,
          hasPlace: false,
        };
      });
    }

    const lordsWithOrder = shuffleMethod(newLords);

    lordsWithOrder.forEach((lord, index) => {
      lord.order = index + 1;
    });

    lordsWithOrder.sort((a, b) => a.order - b.order);

    const newState = {
      ...state,
      dominoes: shuffledDominoes,
      players: newPlayers,
      lords: lordsWithOrder,
      maxTurns,
      maxDominoes,
      dominoesPerTurn,
      turn: 0,
    };

    return newState;
  };

export { setup };
