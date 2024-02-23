import { test } from "@japa/runner";
import gameEngine from "./index.js";
import type { Resp } from "./index.js";

test.group("gameEngine", (group) => {
  let engine: ReturnType<typeof gameEngine>;
  group.setup(() => {
    engine = gameEngine();
  });

  // pick
  // place pick
  // place pick
  let result: Resp;
  test("should initialize a game with players", async ({ expect }) => {
    const players = [{ name: "Player  1" }, { name: "Player  2" }];
    result = await engine.start(players);

    expect(result).toHaveProperty("nextKing");
    expect(result).toHaveProperty("nextAction", "pick");
    expect(result).toHaveProperty("game");
  });

  test("should pick a domino correctly", async ({ expect }) => {
    // Set up a game and simulate a successful pick
    const gameId = result.game.id;
    const kingId = result.nextKing;
    const dominoPick = result.game.currentDominoes[0]!.domino.number;

    let newResult = await engine.pickDomino(gameId, kingId, dominoPick);

    expect(newResult).toHaveProperty("nextKing");
    expect(newResult).toHaveProperty("nextAction", "pick");
    expect(newResult).toHaveProperty("game");

    newResult = await engine.pickDomino(
      gameId,
      newResult.nextKing,
      newResult.game.currentDominoes[1]!.domino.number
    );

    expect(newResult).toHaveProperty("nextKing");
    expect(newResult).toHaveProperty("nextAction", "pick");
    expect(newResult).toHaveProperty("game");

    newResult = await engine.pickDomino(
      gameId,
      newResult.nextKing,
      newResult.game.currentDominoes[2]!.domino.number
    );

    expect(newResult).toHaveProperty("nextKing");
    expect(newResult).toHaveProperty("nextAction", "pick");
    expect(newResult).toHaveProperty("game");

    newResult = await engine.pickDomino(
      gameId,
      newResult.nextKing,
      newResult.game.currentDominoes[3]!.domino.number
    );

    expect(newResult).toHaveProperty("nextKing");
    expect(newResult).toHaveProperty("nextAction", "place");
    expect(newResult).toHaveProperty("game");

    result = newResult;
  });

  test("should place a domino correctly", async ({ expect }) => {
    // Set up a game and simulate a successful placement
    const gameId = result.game.id;
    const kingId = result.nextKing;
    const position = { x: 4, y: 3 };
    const orientation = "horizontal";
    const rotation = 0;

    let newResult = await engine.placeDomino(
      gameId,
      kingId,
      position,
      orientation,
      rotation
    );

    expect(newResult).toHaveProperty("nextKing");
    expect(newResult).toHaveProperty("nextAction", "place");
    expect(newResult).toHaveProperty("game");

    newResult = await engine.placeDomino(
      gameId,
      newResult.nextKing,
      position,
      orientation,
      rotation
    );

    expect(newResult).toHaveProperty("nextKing");
    expect(newResult).toHaveProperty("nextAction", "place");
    expect(newResult).toHaveProperty("game");

    newResult = await engine.placeDomino(
      gameId,
      newResult.nextKing,
      position,
      orientation,
      rotation
    );

    expect(newResult).toHaveProperty("nextKing");
    expect(newResult).toHaveProperty("nextAction", "place");
    expect(newResult).toHaveProperty("game");

    newResult = await engine.placeDomino(
      gameId,
      newResult.nextKing,
      position,
      orientation,
      rotation
    );

    expect(newResult).toHaveProperty("nextKing");
    expect(newResult).toHaveProperty("nextAction", "pick");
    expect(newResult).toHaveProperty("game");
  });
});
