import inMemoryDominoes from "../../../infrastructure/repositories/inMemoryDominoes.js";
import { setup } from "./setup.js";
import type { GameDependencies } from "./game.js";
import type { Game } from "../../entities/game.js";
import { describe, test, expect, beforeEach } from "vitest";

describe("Game Setup", () => {
  let dependencies: GameDependencies;
  let state: Game;
  let useCase: ReturnType<typeof setup>;

  beforeEach(() => {
    dependencies = {
      dominoesRepository: inMemoryDominoes(),
      uuidMethod: () => "uuid-test",
      randomMethod: (array) => array,
    };
    state = {
      id: "uuid-test",
      dominoes: inMemoryDominoes().getAll(),
      currentDominoes: [],
      players: [],
      kings: [],
      turn: 0,
      maxTurns: 0,
      maxDominoes: 0,
      dominoesPerTurn: 0,
      order: {},
    };

    useCase = setup(dependencies);
  });

  test("should add two players to the game", () => {
    // Arrange
    const payload = {
      state,
      players: [{ name: "Player 1" }, { name: "Player 2" }],
    };

    // Act
    const newState = useCase(payload);

    // Assert
    expect(newState.players.length).toEqual(2);
  });

  test("should throw an error if there are less than 2 players", () => {
    // Arrange
    const payload = {
      state,
      players: [{ name: "Player 1" }],
    };

    // Act
    // Assert
    expect(() => useCase(payload)).toThrow("There must be at least 2 players");
  });

  test("should define rules for 2 players", () => {
    // Arrange
    const payload = {
      state,
      players: [{ name: "Player 1" }, { name: "Player 2" }],
    };

    // Act
    const newState = useCase(payload);

    // Assert
    expect(newState.maxDominoes).toEqual(24);
    expect(newState.dominoes.length).toEqual(24);
    expect(newState.currentDominoes.length).toEqual(0);
    expect(newState.dominoesPerTurn).toEqual(4);
    expect(newState.maxTurns).toEqual(6);
    expect(newState.players[0]?.name).toEqual("Player 1");
    expect(newState.players[1]?.name).toEqual("Player 2");
    expect(newState.kings.length).toEqual(4);
  });

  test("should define rules for 3 players", () => {
    // Arrange
    const payload = {
      state,
      players: [
        { name: "Player 1" },
        { name: "Player 2" },
        { name: "Player 3" },
      ],
    };

    // Act
    const newState = useCase(payload);

    // Assert
    expect(newState.maxDominoes).toEqual(36);
    expect(newState.dominoes.length).toEqual(36);
    expect(newState.dominoesPerTurn).toEqual(3);
    expect(newState.maxTurns).toEqual(12);
    expect(newState.players[0]?.name).toEqual("Player 1");
    expect(newState.players[1]?.name).toEqual("Player 2");
    expect(newState.players[2]?.name).toEqual("Player 3");
    expect(newState.kings.length).toEqual(3);
  });

  test("should define rules for 4 players", () => {
    // Arrange
    const payload = {
      state,
      players: [
        { name: "Player 1" },
        { name: "Player 2" },
        { name: "Player 3" },
        { name: "Player 4" },
      ],
    };

    // Act
    const newState = useCase(payload);

    // Assert
    expect(newState.maxDominoes).toEqual(48);
    expect(newState.dominoes.length).toEqual(48);
    expect(newState.dominoesPerTurn).toEqual(4);
    expect(newState.maxTurns).toEqual(12);
    expect(newState.players[0]?.name).toEqual("Player 1");
    expect(newState.players[1]?.name).toEqual("Player 2");
    expect(newState.players[2]?.name).toEqual("Player 3");
    expect(newState.players[3]?.name).toEqual("Player 4");
    expect(newState.kings.length).toEqual(4);
  });

  test("should shuffle dominoes", () => {
    // Arrange
    const deps = {
      ...dependencies,
      randomMethod: (array: any) => [...array].reverse(),
    };

    const id = `uuid-${Math.random()}`;

    state = {
      id,
      dominoes: inMemoryDominoes().getAll(),
      currentDominoes: [],
      players: [],
      kings: [],
      turn: 0,
      maxTurns: 0,
      maxDominoes: 0,
      dominoesPerTurn: 0,
      order: {},
    };

    useCase = setup(deps);

    const payload = {
      state,
      players: [
        { name: "Player 1" },
        { name: "Player 2" },
        { name: "Player 3" },
        { name: "Player 4" },
      ],
    };

    // Act
    const newState = useCase(payload);

    // Assert
    expect(newState.dominoes[0]).toEqual({
      left: {
        type: "wheat",
        crowns: 0,
      },
      right: {
        type: "mine",
        crowns: 3,
      },
      number: 48,
    });
  });

  test("should setup players kings", () => {
    // Arrange
    const payload = {
      state,
      players: [{ name: "Player 1" }, { name: "Player 2" }],
    };

    // Act
    const newState = useCase(payload);

    // Assert
    expect(newState.kings[0]?.playerId).toEqual(newState.players[0]?.id);
    expect(newState.kings[1]?.playerId).toEqual(newState.players[0]?.id);
    expect(newState.kings[2]?.playerId).toEqual(newState.players[1]?.id);
    expect(newState.kings[3]?.playerId).toEqual(newState.players[1]?.id);
  });

  test("should random kings order for 2 players", () => {
    // Arrange
    const id = `uuid-${Math.random()}`;

    const deps = {
      ...dependencies,
      randomMethod: (array: any) => [...array].reverse(),
    };

    state = {
      id,
      dominoes: inMemoryDominoes().getAll(),
      currentDominoes: [],
      players: [],
      kings: [],
      turn: 0,
      maxTurns: 0,
      maxDominoes: 0,
      dominoesPerTurn: 0,
      order: {},
    };

    useCase = setup(deps);

    const payload = {
      state,
      players: [{ name: "Player 1" }, { name: "Player 2" }],
    };

    // Act
    const newState = useCase(payload);

    // Assert
    expect(newState.kings[0]?.order).toEqual(1);
    expect(newState.kings[1]?.order).toEqual(2);
    expect(newState.kings[2]?.order).toEqual(3);
    expect(newState.kings[3]?.order).toEqual(4);
  });

  test("should random kings order for 3 players", () => {
    // Arrange
    const id = `uuid-${Math.random()}`;

    const deps = {
      ...dependencies,
      randomMethod: (array: any) => [...array].reverse(),
    };

    state = {
      id,
      dominoes: inMemoryDominoes().getAll(),
      currentDominoes: [],
      players: [],
      kings: [],
      turn: 0,
      maxTurns: 0,
      maxDominoes: 0,
      dominoesPerTurn: 0,
      order: {},
    };

    useCase = setup(deps);

    const payload = {
      state,
      players: [
        { name: "Player 1" },
        { name: "Player 2" },
        { name: "Player 3" },
      ],
    };

    // Act
    const newState = useCase(payload);

    // Assert
    expect(newState.kings[0]?.order).toEqual(1);
    expect(newState.kings[1]?.order).toEqual(2);
    expect(newState.kings[2]?.order).toEqual(3);
  });
});
