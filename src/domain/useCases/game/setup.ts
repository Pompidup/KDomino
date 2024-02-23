import type { Game } from "../../entities/game.js";
import kingdom from "../../entities/kingdom.js";
import { type GameDependencies, rules } from "./game.js";

type SetupPayload = {
  state: Game;
  players: { name: string }[];
};

const setup =
  (dependencies: GameDependencies) =>
  async (payload: SetupPayload): Promise<Game> => {
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
    const { randomMethod, uuidMethod, gamesRepository } = dependencies;
    const { maxDominoes, dominoesPerTurn, maxTurns } = rules[players.length]!;
    const shuffledDominoes = randomMethod(dominoes);
    shuffledDominoes.splice(maxDominoes);
    //const currentDominoes = drawDominoes(shuffledDominoes, dominoesPerTurn);

    const newPlayers = players.map((player) => {
      return {
        ...player,
        id: uuidMethod(),
      };
    });

    let newKings;
    if (newPlayers.length === 2) {
      newKings = [
        {
          id: uuidMethod(),
          playerId: newPlayers[0]!.id,
          order: 1,
          kingdom: kingdom.createKingdomWithCastle(),
          turnEnded: false,
          hasPick: false,
          hasPlace: false,
        },
        {
          id: uuidMethod(),
          playerId: newPlayers[0]!.id,
          order: 2,
          kingdom: kingdom.createKingdomWithCastle(),
          turnEnded: false,
          hasPick: false,
          hasPlace: false,
        },
        {
          id: uuidMethod(),
          playerId: newPlayers[1]!.id,
          order: 3,
          kingdom: kingdom.createKingdomWithCastle(),
          turnEnded: false,
          hasPick: false,
          hasPlace: false,
        },
        {
          id: uuidMethod(),
          playerId: newPlayers[1]!.id,
          order: 4,
          kingdom: kingdom.createKingdomWithCastle(),
          turnEnded: false,
          hasPick: false,
          hasPlace: false,
        },
      ];
    } else {
      newKings = newPlayers.map((player, index) => {
        return {
          id: uuidMethod(),
          playerId: player.id,
          order: index + 1,
          kingdom: kingdom.createKingdomWithCastle(),
          turnEnded: false,
          hasPick: false,
          hasPlace: false,
        };
      });
    }

    const kingsWithOrder = randomMethod(newKings);

    kingsWithOrder.forEach((king, index) => {
      king.order = index + 1;
    });

    const newState = {
      ...state,
      dominoes: shuffledDominoes,
      players: newPlayers,
      kings: newKings,
      maxTurns,
      maxDominoes,
      dominoesPerTurn,
    };

    await gamesRepository.update(newState);

    return newState;
  };

export { setup };
