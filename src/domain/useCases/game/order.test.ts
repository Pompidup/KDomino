import inMemoryDominoes from "../../../infrastructure/repositories/inMemoryDominoes.js";
import { order } from "./order.js";
import { rules } from "./game.js";
import type { Game, King, Player } from "../../entities/game.js";
import type { Domino, RevealsDomino } from "../../entities/domino.js";
import kingdom from "../../entities/kingdom.js";
import { describe, test, expect } from "vitest";

describe("Game Order", () => {
  test("should throw if not all dominoes have been picked", async () => {
    // Arrange
    const setup = await helper().setupGame(
      2,
      await inMemoryDominoes().getAll()
    );

    setup.currentDominoes[0]!.picked = false;
    setup.kings[0]!.hasPick = false;
    setup.kings[0]!.turnEnded = false;

    const useCase = order();

    const payload = {
      state: setup,
    };

    // Act
    const state = useCase(payload);

    // Assert
    await expect(state).rejects.toThrow("Not all kings have played");
  });

  test("should update order", async () => {
    // Arrange
    const setup = await helper().setupGame(
      2,
      await inMemoryDominoes().getAll()
    );

    const useCase = order();

    const payload = {
      state: setup,
    };

    // Act
    const state = await useCase(payload);

    // Assert
    expect(state.order).toEqual({
      1: "uuid-4",
      2: "uuid-3",
      3: "uuid-2",
      4: "uuid-1",
    });
    expect(state.kings[0]!.order).toEqual(4);
    expect(state.kings[1]!.order).toEqual(3);
    expect(state.kings[2]!.order).toEqual(2);
    expect(state.kings[3]!.order).toEqual(1);
  });
});

const helper = () => {
  const setupGame = async (
    nbPlayers: number,
    allDominoes: Domino[]
  ): Promise<Game> => {
    const id = `uuid-${Math.random()}`;

    const deck = [...allDominoes];
    deck.splice(0, rules[nbPlayers]!.maxDominoes);

    const currentDominoes = deck.splice(0, rules[nbPlayers]!.dominoesPerTurn);
    const formatedCurrentDominoes: RevealsDomino[] = currentDominoes.map(
      (domino, index) => {
        const kingId = `uuid-${5 - (index + 1)}`;
        return {
          domino: domino,
          picked: true,
          kingId,
          position: index + 1,
        };
      }
    );

    const players: Player[] = [];
    for (let i = 0; i < nbPlayers; i++) {
      players.push({ id: `uuid-${i}`, name: `Player ${i}` });
    }

    const kings: King[] = [];

    if (nbPlayers === 2) {
      kings.push(
        {
          id: "uuid-1",
          playerId: "uuid-1",
          order: 1,
          kingdom: kingdom.createKingdomWithCastle(),
          turnEnded: true,
          hasPick: true,
          hasPlace: true,
          dominoPicked: currentDominoes[0],
        },
        {
          id: "uuid-2",
          playerId: "uuid-1",
          order: 2,
          kingdom: kingdom.createKingdomWithCastle(),
          turnEnded: true,
          hasPick: true,
          hasPlace: true,
          dominoPicked: currentDominoes[1],
        },
        {
          id: "uuid-3",
          playerId: "uuid-2",
          order: 3,
          kingdom: kingdom.createKingdomWithCastle(),
          turnEnded: true,
          hasPick: true,
          hasPlace: true,
          dominoPicked: currentDominoes[2],
        },
        {
          id: "uuid-4",
          playerId: "uuid-2",
          order: 4,
          kingdom: kingdom.createKingdomWithCastle(),
          turnEnded: true,
          hasPick: true,
          hasPlace: true,
          dominoPicked: currentDominoes[3],
        }
      );
    } else {
      for (let i = 0; i < nbPlayers; i++) {
        kings.push({
          id: `uuid-${i + 1}`,
          playerId: `uuid-${i + 1}`,
          order: i + 1,
          kingdom: kingdom.createKingdomWithCastle(),
          turnEnded: true,
          hasPick: true,
          hasPlace: true,
          dominoPicked: currentDominoes[i],
        });
      }
    }

    const initialState = {
      id,
      dominoes: deck,
      currentDominoes: formatedCurrentDominoes,
      players,
      kings,
      turn: 1,
      maxTurns: rules[nbPlayers]!.maxTurns,
      maxDominoes: rules[nbPlayers]!.maxDominoes,
      dominoesPerTurn: rules[nbPlayers]!.dominoesPerTurn,
      order: {
        1: "uuid-1",
        2: "uuid-2",
        3: "uuid-3",
        4: "uuid-4",
      },
    };

    return initialState;
  };

  return {
    setupGame,
  };
};
