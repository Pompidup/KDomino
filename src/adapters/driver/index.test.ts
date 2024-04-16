import { beforeAll, describe, expect, test } from "vitest";
import gameEngine from "./index.js";
import type { Resp } from "./index.js";
import {
  Orientation,
  Rotation,
} from "../../hexagon/internal/entities/kingdom.js";

describe("gameEngine", () => {
  let engine: ReturnType<typeof gameEngine>;

  beforeAll(() => {
    engine = gameEngine();
  });

  let result: Resp;
  test("should play a game with 2 players", () => {
    const mode = engine.getMode();
    console.log("mode", mode);

    const initialState = engine.init();

    /**
     * Turn 0 / Setup
     **/
    const players = [{ name: "Player  1" }, { name: "Player  2" }];
    result = engine.start(initialState, players);

    expect(result).toHaveProperty("nextLord");
    expect(result).toHaveProperty("nextAction", "pick");
    expect(result).toHaveProperty("game");
    expect(result.nextLord).toEqual(result.game.lords[0].id);
    expect(result.game.turn).toEqual(0);

    let game = result.game;
    let lordId = result.nextLord;
    const dominoPick = result.game.currentDominoes[0]!.domino.number;

    /**
     * Turn 0
     **/
    let newResult = engine.pickDomino(game, lordId, dominoPick);

    expect(newResult).toHaveProperty("nextLord");
    expect(newResult).toHaveProperty("nextAction", "pick");
    expect(newResult).toHaveProperty("game");
    expect(newResult.nextLord).toEqual(result.game.lords[1].id);
    expect(newResult.game.turn).toEqual(0);
    newResult = engine.pickDomino(
      game,
      newResult.nextLord,
      newResult.game.currentDominoes[1]!.domino.number
    );

    expect(newResult).toHaveProperty("nextLord");
    expect(newResult).toHaveProperty("nextAction", "pick");
    expect(newResult).toHaveProperty("game");
    expect(newResult.nextLord).toEqual(result.game.lords[2].id);
    expect(newResult.game.turn).toEqual(0);

    newResult = engine.pickDomino(
      game,
      newResult.nextLord,
      newResult.game.currentDominoes[2]!.domino.number
    );

    expect(newResult).toHaveProperty("nextLord");
    expect(newResult).toHaveProperty("nextAction", "pick");
    expect(newResult).toHaveProperty("game");
    expect(newResult.nextLord).toEqual(result.game.lords[3].id);
    expect(newResult.game.turn).toEqual(0);

    newResult = engine.pickDomino(
      game,
      newResult.nextLord,
      newResult.game.currentDominoes[3]!.domino.number
    );

    expect(newResult).toHaveProperty("nextLord");
    expect(newResult).toHaveProperty("nextAction", "place");
    expect(newResult).toHaveProperty("game");
    expect(newResult.nextLord).toEqual(result.game.lords[0].id);
    expect(newResult.game.turn).toEqual(1);

    /**
     * Turn 1
     **/
    let orientation = <Orientation>"horizontal";
    let rotation = <Rotation>0;

    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 5, y: 4 },
      orientation,
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextLord).toEqual(newResult.nextLord);

    newResult = engine.pickDomino(
      newResult.game,
      newResult.nextLord,
      newResult.game.currentDominoes[0].domino.number
    );

    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 5, y: 5 },
      orientation,
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextLord).toEqual(newResult.nextLord);

    newResult = engine.pickDomino(
      newResult.game,
      newResult.nextLord,
      newResult.game.currentDominoes[1].domino.number
    );

    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 5, y: 4 },
      orientation,
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextLord).toEqual(newResult.nextLord);

    newResult = engine.pickDomino(
      newResult.game,
      newResult.nextLord,
      newResult.game.currentDominoes[2].domino.number
    );

    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 5, y: 5 },
      orientation,
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextLord).toEqual(newResult.nextLord);

    newResult = engine.pickDomino(
      newResult.game,
      newResult.nextLord,
      newResult.game.currentDominoes[3].domino.number
    );

    expect(newResult.game.turn).toEqual(2);

    /**
     * Turn 2
     **/
    orientation = "horizontal";
    rotation = 0;

    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 4, y: 3 },
      orientation,
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextLord).toEqual(newResult.nextLord);

    newResult = engine.pickDomino(
      newResult.game,
      newResult.nextLord,
      newResult.game.currentDominoes[0].domino.number
    );

    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 6, y: 2 },
      "vertical",
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextLord).toEqual(newResult.nextLord);

    newResult = engine.pickDomino(
      newResult.game,
      newResult.nextLord,
      newResult.game.currentDominoes[1].domino.number
    );

    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 4, y: 3 },
      orientation,
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextLord).toEqual(newResult.nextLord);

    newResult = engine.pickDomino(
      newResult.game,
      newResult.nextLord,
      newResult.game.currentDominoes[2].domino.number
    );

    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 6, y: 2 },
      "vertical",
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextLord).toEqual(newResult.nextLord);

    newResult = engine.pickDomino(
      newResult.game,
      newResult.nextLord,
      newResult.game.currentDominoes[3].domino.number
    );

    expect(newResult.game.turn).toEqual(3);

    /**
     * Turn 3
     **/
    orientation = "horizontal";
    rotation = 0;

    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 4, y: 5 },
      "vertical",
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextLord).toEqual(newResult.nextLord);

    newResult = engine.pickDomino(
      newResult.game,
      newResult.nextLord,
      newResult.game.currentDominoes[0].domino.number
    );

    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 2, y: 4 },
      orientation,
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextLord).toEqual(newResult.nextLord);

    newResult = engine.pickDomino(
      newResult.game,
      newResult.nextLord,
      newResult.game.currentDominoes[1].domino.number
    );

    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 4, y: 5 },
      "vertical",
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextLord).toEqual(newResult.nextLord);

    newResult = engine.pickDomino(
      newResult.game,
      newResult.nextLord,
      newResult.game.currentDominoes[2].domino.number
    );

    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 2, y: 4 },
      orientation,
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextLord).toEqual(newResult.nextLord);

    newResult = engine.pickDomino(
      newResult.game,
      newResult.nextLord,
      newResult.game.currentDominoes[3].domino.number
    );

    expect(newResult.game.turn).toEqual(4);

    /**
     * Turn 4
     **/
    orientation = "horizontal";
    rotation = 0;

    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 4, y: 2 },
      orientation,
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextLord).toEqual(newResult.nextLord);

    newResult = engine.pickDomino(
      newResult.game,
      newResult.nextLord,
      newResult.game.currentDominoes[0].domino.number
    );

    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 5, y: 6 },
      orientation,
      180
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextLord).toEqual(newResult.nextLord);

    newResult = engine.pickDomino(
      newResult.game,
      newResult.nextLord,
      newResult.game.currentDominoes[1].domino.number
    );

    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 2, y: 6 },
      orientation,
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextLord).toEqual(newResult.nextLord);

    newResult = engine.pickDomino(
      newResult.game,
      newResult.nextLord,
      newResult.game.currentDominoes[2].domino.number
    );

    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 2, y: 5 },
      orientation,
      rotation
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextLord).toEqual(newResult.nextLord);

    newResult = engine.pickDomino(
      newResult.game,
      newResult.nextLord,
      newResult.game.currentDominoes[3].domino.number
    );

    expect(newResult.game.turn).toEqual(5);

    /**
     * Turn 5
     **/

    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 3, y: 2 },
      "vertical",
      180
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextLord).toEqual(newResult.nextLord);

    newResult = engine.pickDomino(
      newResult.game,
      newResult.nextLord,
      newResult.game.currentDominoes[0].domino.number
    );

    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 2, y: 2 },
      "vertical",
      180
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextLord).toEqual(newResult.nextLord);

    newResult = engine.pickDomino(
      newResult.game,
      newResult.nextLord,
      newResult.game.currentDominoes[1].domino.number
    );

    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 5, y: 6 },
      "horizontal",
      0
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextLord).toEqual(newResult.nextLord);

    newResult = engine.pickDomino(
      newResult.game,
      newResult.nextLord,
      newResult.game.currentDominoes[2].domino.number
    );

    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 4, y: 2 },
      "horizontal",
      0
    );

    expect(newResult.nextAction).toEqual("pick");
    expect(newResult.nextLord).toEqual(newResult.nextLord);

    newResult = engine.pickDomino(
      newResult.game,
      newResult.nextLord,
      newResult.game.currentDominoes[3].domino.number
    );

    expect(newResult.game.turn).toEqual(6);

    /**
     * Turn 6
     **/
    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 2, y: 5 },
      "vertical",
      180
    );

    expect(newResult.nextAction).toEqual("place");
    expect(newResult.nextLord).toEqual(newResult.game.lords[1].id);

    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 3, y: 5 },
      "vertical",
      180
    );

    expect(newResult.nextAction).toEqual("place");
    expect(newResult.nextLord).toEqual(newResult.game.lords[2].id);

    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 3, y: 2 },
      "vertical",
      0
    );

    expect(newResult.nextAction).toEqual("place");
    expect(newResult.nextLord).toEqual(newResult.game.lords[3].id);

    newResult = engine.placeDomino(
      newResult.game,
      newResult.nextLord,
      { x: 2, y: 2 },
      "vertical",
      180
    );

    expect(newResult.nextAction).toEqual("end");
    expect(newResult.game.turn).toEqual(6);

    const finalResult = engine.endGame(newResult.game);

    expect(finalResult.result).toEqual([
      {
        position: 1,
        playerId: expect.any(String),
        playerName: "Player  2",
        details: {
          score: 8,
          maxPropertiesSize: 5,
          totalCrowns: 4,
        },
      },
      {
        position: 2,
        playerId: expect.any(String),
        playerName: "Player  1",
        details: {
          score: 4,
          maxPropertiesSize: 7,
          totalCrowns: 2,
        },
      },
    ]);
  });
});
