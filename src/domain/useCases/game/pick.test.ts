import { test } from "@japa/runner";

import inMemoryDominoes from "../../../infrastructure/repositories/inMemoryDominoes.js";
import inMemoryGamesRepository from "../../../infrastructure/repositories/inMemoryGames.js";
import { pick } from "./pick.js";
import { type GameDependencies, playerAction, rules } from "./game.js";
import type { Game } from "../../entities/game.js";
import type { Domino, RevealsDomino } from "../../entities/domino.js";
import kingdom from "../../entities/kingdom.js";

test.group("Game Pick", (group) => {
  let gamesRepository: ReturnType<typeof inMemoryGamesRepository>;
  let dependencies: GameDependencies;

  group.setup(async () => {
    gamesRepository = inMemoryGamesRepository();
    dependencies = {
      dominoesRepository: inMemoryDominoes(),
      gamesRepository,
      uuidMethod: () => "uuid-test",
      randomMethod: (array) => array,
    };
  });

  test("should save player choice", async ({ expect }) => {
    // Arrange
    const setup = await helper().setupGame(
      2,
      await inMemoryDominoes().getAll()
    );

    await gamesRepository.setup(setup);

    const useCase = pick(dependencies);

    const payload = {
      kingId: "uuid-1",
      action: playerAction.pick,
      data: {
        state: setup,
        dominoPick: setup.currentDominoes[0]!.domino.number,
      },
    };

    // Act
    const state = await useCase(payload);

    // Assert
    expect(state.currentDominoes[0]!.picked).toEqual(true);
    expect(state.currentDominoes[0]!.kingId).toEqual("uuid-1");
    expect(state.kings[0]!.hasPick).toEqual(true);
    expect(state.kings[0]!.turnEnded).toEqual(true);
  });

  test("should throw if it is not the player turn", async ({ expect }) => {
    // Arrange
    const setup = await helper().setupGame(
      2,
      await inMemoryDominoes().getAll()
    );

    await gamesRepository.setup(setup);

    const useCase = pick(dependencies);

    const payload = {
      kingId: "uuid-2",
      action: playerAction.pick,
      data: {
        state: setup,
        dominoPick: setup.currentDominoes[0]!.domino.number,
      },
    };

    // Act
    const action = useCase(payload);

    // Assert
    await expect(action).rejects.toThrow("It is not your turn");
  });

  test("should throw if the player choose an invalid domino", async ({
    expect,
  }) => {
    // Arrange
    const setup = await helper().setupGame(
      2,
      await inMemoryDominoes().getAll()
    );

    await gamesRepository.setup(setup);

    const useCase = pick(dependencies);

    const payload = {
      kingId: "uuid-1",
      action: playerAction.pick,
      data: {
        state: setup,
        dominoPick: 999,
      },
    };

    // Act
    const action = useCase(payload);

    // Assert
    await expect(action).rejects.toThrow("Domino not found");
  });

  test("should throw if player choose an already picked domino", async ({
    expect,
  }) => {
    // Arrange
    const setup = await helper().setupGame(
      2,
      await inMemoryDominoes().getAll()
    );
    setup.currentDominoes[0]!.picked = true;
    setup.currentDominoes[0]!.kingId = "uuid-1";

    await gamesRepository.setup(setup);

    const useCase = pick(dependencies);

    const payload = {
      kingId: "uuid-2",
      action: playerAction.pick,
      data: {
        state: setup,
        dominoPick: setup.currentDominoes[0]!.domino.number,
      },
    };

    // Act
    const action = useCase(payload);

    // Assert
    await expect(action).rejects.toThrow("Domino already picked");
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
        return {
          domino: domino,
          picked: false,
          kingId: null,
          position: index,
        };
      }
    );

    const players = [];
    for (let i = 0; i < nbPlayers; i++) {
      players.push({ id: `uuid-${i}`, name: `Player ${i}` });
    }

    const kings = [];

    if (nbPlayers === 2) {
      kings.push(
        {
          id: "uuid-1",
          playerId: "uuid-1",
          order: 1,
          kingdom: kingdom.createKingdomWithCastle(),
          turnEnded: false,
          hasPick: false,
          hasPlace: false,
        },
        {
          id: "uuid-2",
          playerId: "uuid-1",
          order: 2,
          kingdom: kingdom.createKingdomWithCastle(),
          turnEnded: false,
          hasPick: false,
          hasPlace: false,
        },
        {
          id: "uuid-3",
          playerId: "uuid-2",
          order: 3,
          kingdom: kingdom.createKingdomWithCastle(),
          turnEnded: false,
          hasPick: false,
          hasPlace: false,
        },
        {
          id: "uuid-4",
          playerId: "uuid-2",
          order: 4,
          kingdom: kingdom.createKingdomWithCastle(),
          turnEnded: false,
          hasPick: false,
          hasPlace: false,
        }
      );
    } else {
      for (let i = 0; i < nbPlayers; i++) {
        kings.push({
          id: `uuid-${i + 1}`,
          playerId: `uuid-${i + 1}`,
          order: i + 1,
          kingdom: kingdom.createKingdomWithCastle(),
          turnEnded: false,
          hasPick: false,
          hasPlace: false,
        });
      }
    }

    const initialState = {
      id,
      dominoes: deck,
      currentDominoes: formatedCurrentDominoes,
      players,
      kings,
      turn: 0,
      maxTurns: rules[nbPlayers]!.maxTurns,
      maxDominoes: rules[nbPlayers]!.maxDominoes,
      dominoesPerTurn: rules[nbPlayers]!.dominoesPerTurn,
      order: {},
    };

    return initialState;
  };

  return {
    setupGame,
  };
};
