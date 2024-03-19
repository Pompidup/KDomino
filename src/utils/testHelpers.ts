import type { Game, King, Player } from "../domain/entities/game.js";
import type {
  Domino,
  EmptyTile,
  RevealsDomino,
  Tile,
} from "../domain/entities/domino.js";
import { rules } from "../domain/useCases/game/game.js";
import kingdom from "../domain/entities/kingdom.js";

const helper = () => {
  const setupGame = (
    nbPlayers: number,
    allDominoes: Domino[],
    firstPick?: boolean,
    turnCompleted?: boolean
  ): Game => {
    const id = `uuid-${Math.random()}`;

    const deck = [...allDominoes];
    deck.splice(0, rules[nbPlayers]!.maxDominoes); //24

    const currentDominoes = deck.splice(0, rules[nbPlayers]!.dominoesPerTurn);
    const formatedCurrentDominoes: RevealsDomino[] = currentDominoes.map(
      (domino, index) => {
        const kingId = `uuid-${5 - (index + 1)}`;
        return {
          domino: domino,
          picked: turnCompleted || firstPick ? true : false,
          kingId: turnCompleted || firstPick ? kingId : null,
          position: index + 1,
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
        turnEnded: turnCompleted ? true : false,
        hasPick: turnCompleted || firstPick ? true : false,
        hasPlace: turnCompleted ? true : false,
        dominoPicked:
          turnCompleted || firstPick ? currentDominoes[0] : undefined,
      });
      kings.push({
        id: `uuid-2`,
        playerId: `uuid-0`,
        order: 2,
        turnEnded: turnCompleted ? true : false,
        hasPick: turnCompleted || firstPick ? true : false,
        hasPlace: turnCompleted ? true : false,
        dominoPicked:
          turnCompleted || firstPick ? currentDominoes[1] : undefined,
      });
      kings.push({
        id: `uuid-3`,
        playerId: `uuid-1`,
        order: 3,
        turnEnded: turnCompleted ? true : false,
        hasPick: turnCompleted || firstPick ? true : false,
        hasPlace: turnCompleted ? true : false,
        dominoPicked:
          turnCompleted || firstPick ? currentDominoes[2] : undefined,
      });
      kings.push({
        id: `uuid-4`,
        playerId: `uuid-1`,
        order: 4,
        turnEnded: turnCompleted ? true : false,
        hasPick: turnCompleted || firstPick ? true : false,
        hasPlace: turnCompleted ? true : false,
        dominoPicked:
          turnCompleted || firstPick ? currentDominoes[3] : undefined,
      });
    } else {
      for (let i = 0; i < nbPlayers; i++) {
        kings.push({
          id: `uuid-${i + 1}`,
          playerId: `uuid-${i}`,
          order: i + 1,
          turnEnded: turnCompleted ? true : false,
          hasPick: turnCompleted || firstPick ? true : false,
          hasPlace: turnCompleted ? true : false,
          dominoPicked:
            turnCompleted || firstPick ? currentDominoes[i] : undefined,
        });
      }
    }

    const initialState = {
      id,
      dominoes: deck,
      currentDominoes: formatedCurrentDominoes,
      players,
      kings,
      turn: turnCompleted ? 1 : 0,
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

  return {
    setupGame,
    displayGrid,
  };
};

export default helper;
