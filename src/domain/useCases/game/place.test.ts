import inMemoryDominoes from "../../../infrastructure/repositories/inMemoryDominoes.js";
import { place } from "./place.js";
import kingdom, {
  type Orientation,
  type Rotation,
} from "../../entities/kingdom.js";
import { playerAction, rules } from "./game.js";
import type {
  Domino,
  EmptyTile,
  RevealsDomino,
  Tile,
} from "../../entities/domino.js";
import type { Game, King, Player } from "../../entities/game.js";
import { describe, test, expect } from "vitest";

describe("Game Place", () => {
  test("should add domino to kingdom", async () => {
    // Arrange
    const setup = await helper().setupGame(
      2,
      await inMemoryDominoes().getAll()
    );

    const useCase = place();

    const payload = {
      kingId: "uuid-4",
      action: playerAction.place,
      data: {
        state: setup,
        position: {
          x: 4,
          y: 3,
        },
        orientation: <Orientation>"horizontal",
        rotation: <Rotation>0,
      },
    };

    // Act
    const state = await useCase(payload);

    const expectedKingdom = kingdom.createKingdomWithCastle();

    expectedKingdom[3][4] = {
      type: setup.currentDominoes[3].domino.left.type,
      crowns: setup.currentDominoes[3].domino.left.crowns,
    };

    expectedKingdom[3][5] = {
      type: setup.currentDominoes[3].domino.right.type,
      crowns: setup.currentDominoes[3].domino.right.crowns,
    };

    // Assert
    expect(state.players[1].kingdom).toEqual(expectedKingdom);
    expect(state.kings[3].hasPlace).toEqual(true);
    expect(state.kings[3].turnEnded).toEqual(false);
  });

  test("should throw if not fit grid", async () => {
    // Arrange
    const setup = await helper().setupGame(
      2,
      await inMemoryDominoes().getAll()
    );

    setup.players[1].kingdom[4][5] = {
      type: "wheat",
      crowns: 0,
    };
    setup.players[1].kingdom[4][6] = {
      type: "wheat",
      crowns: 1,
    };
    setup.players[1].kingdom[4][7] = {
      type: "wheat",
      crowns: 2,
    };
    setup.players[1].kingdom[5][7] = {
      type: "wheat",
      crowns: 3,
    };

    const useCase = place();

    const payload = {
      kingId: setup.kings[3].id,
      action: playerAction.place,
      data: {
        state: setup,
        position: {
          x: 4,
          y: 8,
        },
        orientation: <Orientation>"horizontal",
        rotation: <Rotation>180,
      },
    };
    // Act
    const state = useCase(payload);

    // Assert
    expect(state).rejects.toThrow("Invalid placement (not fit into the grid)");
  });
});

const helper = () => {
  const setupGame = async (
    nbPlayers: number,
    allDominoes: Domino[]
  ): Promise<Game> => {
    const id = `uuid-${Math.random()}`;

    const deck = [...allDominoes];
    deck.splice(0, rules[nbPlayers]!.maxDominoes); //24

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

    const players: Player[] = [];
    for (let i = 0; i < nbPlayers; i++) {
      players.push({
        id: `uuid-${i}`,
        name: `Player ${i}`,
        kingdom: kingdom.createKingdomWithCastle(),
      });
    }

    const kings: King[] = [];

    if (nbPlayers === 2) {
      kings.push({
        id: `uuid-1`,
        playerId: `uuid-0`,
        order: 1,
        turnEnded: false,
        hasPick: false,
        hasPlace: false,
        dominoPicked: currentDominoes[0],
      });
      kings.push({
        id: `uuid-2`,
        playerId: `uuid-0`,
        order: 2,
        turnEnded: false,
        hasPick: false,
        hasPlace: false,
        dominoPicked: currentDominoes[1],
      });
      kings.push({
        id: `uuid-3`,
        playerId: `uuid-1`,
        order: 3,
        turnEnded: false,
        hasPick: false,
        hasPlace: false,
        dominoPicked: currentDominoes[2],
      });
      kings.push({
        id: `uuid-4`,
        playerId: `uuid-1`,
        order: 4,
        turnEnded: false,
        hasPick: false,
        hasPlace: false,
        dominoPicked: currentDominoes[3],
      });
    } else {
      for (let i = 0; i < nbPlayers; i++) {
        kings.push({
          id: `uuid-${i + 1}`,
          playerId: `uuid-${i}`,
          order: i + 1,
          turnEnded: false,
          hasPick: false,
          hasPlace: false,
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

// Helper function to display grid in console
const displayGrid = (grid: (Tile | EmptyTile)[][]) => {
  const display = grid
    .map((row) => {
      return row
        .map((cell) => {
          if (cell) {
            const type = cell.type.charAt(0).toUpperCase(); // Use the first character of the type, capitalized
            const crowns = cell.crowns;
            return `[${type}${crowns}]`;
          }
          return "[00]"; // Represent empty cells with [00]
        })
        .join(""); // Join the cells in the row without any separators
    })
    .join("\n"); // Join the rows with a newline character

  console.log(display);
};
