import { beforeAll, describe, expect, test } from "vitest";
import gameEngine from "./index.js";
import type { Resp } from "./index.js";
import { Orientation, Rotation } from "../../domain/entities/kingdom.js";
import { EmptyTile, Tile } from "../../domain/entities/domino.js";

describe("gameEngine", () => {
  let engine: ReturnType<typeof gameEngine>;

  beforeAll(() => {
    engine = gameEngine();
  });

  let result: Resp;
  test("should play a game with 2 players", async () => {
    /**
     * Turn 0 / Setup
     **/
    const players = [{ name: "Player  1" }, { name: "Player  2" }];
    result = await engine.start(players);

    expect(result).toHaveProperty("nextKing");
    expect(result).toHaveProperty("nextAction", "pick");
    expect(result).toHaveProperty("game");
    expect(result.nextKing).toEqual(result.game.kings[0].id);
    expect(result.game.turn).toEqual(0);

    let game = result.game;
    let kingId = result.nextKing;
    const dominoPick = result.game.currentDominoes[0]!.domino.number;

    /**
     * Turn 0
     **/
    let newResult = await engine.pickDomino(game, kingId, dominoPick);

    expect(newResult).toHaveProperty("nextKing");
    expect(newResult).toHaveProperty("nextAction", "pick");
    expect(newResult).toHaveProperty("game");
    expect(newResult.nextKing).toEqual(result.game.kings[1].id);
    expect(newResult.game.turn).toEqual(0);
    newResult = await engine.pickDomino(
      game,
      newResult.nextKing,
      newResult.game.currentDominoes[1]!.domino.number
    );

    expect(newResult).toHaveProperty("nextKing");
    expect(newResult).toHaveProperty("nextAction", "pick");
    expect(newResult).toHaveProperty("game");
    expect(newResult.nextKing).toEqual(result.game.kings[2].id);
    expect(newResult.game.turn).toEqual(0);

    newResult = await engine.pickDomino(
      game,
      newResult.nextKing,
      newResult.game.currentDominoes[2]!.domino.number
    );

    expect(newResult).toHaveProperty("nextKing");
    expect(newResult).toHaveProperty("nextAction", "pick");
    expect(newResult).toHaveProperty("game");
    expect(newResult.nextKing).toEqual(result.game.kings[3].id);
    expect(newResult.game.turn).toEqual(0);

    newResult = await engine.pickDomino(
      game,
      newResult.nextKing,
      newResult.game.currentDominoes[3]!.domino.number
    );

    expect(newResult).toHaveProperty("nextKing");
    expect(newResult).toHaveProperty("nextAction", "place");
    expect(newResult).toHaveProperty("game");
    expect(newResult.nextKing).toEqual(result.game.kings[0].id);
    expect(newResult.game.turn).toEqual(1);

    /**
     * Turn 1
     **/
    let orientation = <Orientation>"horizontal";
    let rotation = <Rotation>0;

    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 5, y: 4 },
      orientation,
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextKing).toEqual(newResult.nextKing);

    newResult = await engine.pickDomino(
      newResult.game,
      newResult.nextKing,
      newResult.game.currentDominoes[0].domino.number
    );

    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 5, y: 5 },
      orientation,
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextKing).toEqual(newResult.nextKing);

    newResult = await engine.pickDomino(
      newResult.game,
      newResult.nextKing,
      newResult.game.currentDominoes[1].domino.number
    );

    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 5, y: 4 },
      orientation,
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextKing).toEqual(newResult.nextKing);

    newResult = await engine.pickDomino(
      newResult.game,
      newResult.nextKing,
      newResult.game.currentDominoes[2].domino.number
    );

    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 5, y: 5 },
      orientation,
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextKing).toEqual(newResult.nextKing);

    newResult = await engine.pickDomino(
      newResult.game,
      newResult.nextKing,
      newResult.game.currentDominoes[3].domino.number
    );

    expect(newResult.game.turn).toEqual(2);

    /**
     * Turn 2
     **/
    orientation = "horizontal";
    rotation = 0;

    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 4, y: 3 },
      orientation,
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextKing).toEqual(newResult.nextKing);

    newResult = await engine.pickDomino(
      newResult.game,
      newResult.nextKing,
      newResult.game.currentDominoes[0].domino.number
    );

    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 6, y: 2 },
      "vertical",
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextKing).toEqual(newResult.nextKing);

    newResult = await engine.pickDomino(
      newResult.game,
      newResult.nextKing,
      newResult.game.currentDominoes[1].domino.number
    );

    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 4, y: 3 },
      orientation,
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextKing).toEqual(newResult.nextKing);

    newResult = await engine.pickDomino(
      newResult.game,
      newResult.nextKing,
      newResult.game.currentDominoes[2].domino.number
    );

    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 6, y: 2 },
      "vertical",
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextKing).toEqual(newResult.nextKing);

    newResult = await engine.pickDomino(
      newResult.game,
      newResult.nextKing,
      newResult.game.currentDominoes[3].domino.number
    );

    expect(newResult.game.turn).toEqual(3);

    /**
     * Turn 3
     **/
    orientation = "horizontal";
    rotation = 0;

    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 4, y: 5 },
      "vertical",
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextKing).toEqual(newResult.nextKing);

    newResult = await engine.pickDomino(
      newResult.game,
      newResult.nextKing,
      newResult.game.currentDominoes[0].domino.number
    );

    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 2, y: 4 },
      orientation,
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextKing).toEqual(newResult.nextKing);

    newResult = await engine.pickDomino(
      newResult.game,
      newResult.nextKing,
      newResult.game.currentDominoes[1].domino.number
    );

    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 4, y: 5 },
      "vertical",
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextKing).toEqual(newResult.nextKing);

    newResult = await engine.pickDomino(
      newResult.game,
      newResult.nextKing,
      newResult.game.currentDominoes[2].domino.number
    );

    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 2, y: 4 },
      orientation,
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextKing).toEqual(newResult.nextKing);

    newResult = await engine.pickDomino(
      newResult.game,
      newResult.nextKing,
      newResult.game.currentDominoes[3].domino.number
    );

    expect(newResult.game.turn).toEqual(4);

    /**
     * Turn 4
     **/
    orientation = "horizontal";
    rotation = 0;

    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 4, y: 2 },
      orientation,
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextKing).toEqual(newResult.nextKing);

    newResult = await engine.pickDomino(
      newResult.game,
      newResult.nextKing,
      newResult.game.currentDominoes[0].domino.number
    );

    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 5, y: 6 },
      orientation,
      180
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextKing).toEqual(newResult.nextKing);

    newResult = await engine.pickDomino(
      newResult.game,
      newResult.nextKing,
      newResult.game.currentDominoes[1].domino.number
    );

    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 2, y: 6 },
      orientation,
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextKing).toEqual(newResult.nextKing);

    newResult = await engine.pickDomino(
      newResult.game,
      newResult.nextKing,
      newResult.game.currentDominoes[2].domino.number
    );

    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 2, y: 5 },
      orientation,
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextKing).toEqual(newResult.nextKing);

    newResult = await engine.pickDomino(
      newResult.game,
      newResult.nextKing,
      newResult.game.currentDominoes[3].domino.number
    );

    expect(newResult.game.turn).toEqual(5);

    /**
     * Turn 5
     **/

    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 3, y: 2 },
      "vertical",
      180
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextKing).toEqual(newResult.nextKing);

    newResult = await engine.pickDomino(
      newResult.game,
      newResult.nextKing,
      newResult.game.currentDominoes[0].domino.number
    );

    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 2, y: 2 },
      "vertical",
      180
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextKing).toEqual(newResult.nextKing);

    newResult = await engine.pickDomino(
      newResult.game,
      newResult.nextKing,
      newResult.game.currentDominoes[1].domino.number
    );

    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 5, y: 6 },
      "horizontal",
      0
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextKing).toEqual(newResult.nextKing);

    newResult = await engine.pickDomino(
      newResult.game,
      newResult.nextKing,
      newResult.game.currentDominoes[2].domino.number
    );

    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 4, y: 2 },
      "horizontal",
      0
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextKing).toEqual(newResult.nextKing);

    newResult = await engine.pickDomino(
      newResult.game,
      newResult.nextKing,
      newResult.game.currentDominoes[3].domino.number
    );

    expect(newResult.game.turn).toEqual(6);

    /**
     * Turn 6
     **/
    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 2, y: 5 },
      "vertical",
      180
    );

    expect(newResult.nextAction).toEqual("place");
    expect(newResult.nextKing).toEqual(newResult.game.kings[1].id);

    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 3, y: 5 },
      "vertical",
      180
    );

    expect(newResult.nextAction).toEqual("place");
    expect(newResult.nextKing).toEqual(newResult.game.kings[2].id);

    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 3, y: 2 },
      "vertical",
      0
    );

    expect(newResult.nextAction).toEqual("place");
    expect(newResult.nextKing).toEqual(newResult.game.kings[3].id);

    newResult = await engine.placeDomino(
      newResult.game,
      newResult.nextKing,
      { x: 2, y: 2 },
      "vertical",
      180
    );

    expect(newResult.nextAction).toEqual("end");
    expect(newResult.game.turn).toEqual(6);

    const finalResult = await engine.endGame(newResult.game);

    expect(finalResult).toHaveProperty("winner");
    expect(finalResult).toHaveProperty("scores");
    expect(finalResult).toHaveProperty("game");
    expect(finalResult.winner).toEqual("Player  2");
    expect(finalResult.scores[0].score.score).toEqual(8);
    expect(finalResult.scores[1].score.score).toEqual(4);
  });
});

const displayGrid = (grid: (Tile | EmptyTile)[][]) => {
  const display = grid
    .map((row) => {
      return row
        .map((cell) => {
          if (cell) {
            const type = cell.type.toUpperCase(); // Use the first character of the type, capitalized
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
