import { canKingdomFitDominoes } from "@core/domain/entities/harmony.js";
import {
  createEmptyKingdom,
  placeCastle,
} from "@core/domain/entities/kingdom.js";
import type { Kingdom } from "@core/domain/types/kingdom.js";
import { describe, expect, test } from "vitest";

/** Castle at (4,4) plus wheat on the given squares. */
const kingdomWith = (squares: [number, number][]): Kingdom => {
  const kingdom = placeCastle(createEmptyKingdom());
  for (const [x, y] of squares) kingdom[y]![x] = { type: "wheat", crowns: 0 };
  return kingdom;
};

/** Every square of the frame [min, max]² but the castle and `holes`. */
const frameWithHoles = (
  min: number,
  max: number,
  holes: [number, number][],
): Kingdom => {
  const squares: [number, number][] = [];
  for (let y = min; y <= max; y++) {
    for (let x = min; x <= max; x++) {
      if (x === 4 && y === 4) continue;
      if (holes.some(([hx, hy]) => hx === x && hy === y)) continue;
      squares.push([x, y]);
    }
  }
  return kingdomWith(squares);
};

describe("canKingdomFitDominoes", () => {
  test("a castle alone fits the 12 dominoes of a 5x5 kingdom", () => {
    expect(canKingdomFitDominoes(kingdomWith([]), 5, 12)).toBe(true);
    // 25 squares: never more than 12 dominoes around the castle
    expect(canKingdomFitDominoes(kingdomWith([]), 5, 13)).toBe(false);
  });

  test("nothing left to place always fits", () => {
    expect(canKingdomFitDominoes(frameWithHoles(2, 6, []), 5, 0)).toBe(true);
  });

  test("an off-centre kingdom can still slide its frame", () => {
    // A line from the castle to the right edge of the grid: the 5x5 frame
    // must be [4, 8] in x, any frame in y
    const line = kingdomWith([
      [5, 4],
      [6, 4],
      [7, 4],
      [8, 4],
    ]);
    expect(canKingdomFitDominoes(line, 5, 10)).toBe(true);
    expect(canKingdomFitDominoes(line, 5, 11)).toBe(false);
  });

  test("holes that cannot hold a domino make the kingdom incomplete", () => {
    // Two holes of 2 adjacent squares: 2 dominoes fit
    const pairs = frameWithHoles(2, 6, [
      [2, 2],
      [3, 2],
      [5, 6],
      [6, 6],
    ]);
    expect(canKingdomFitDominoes(pairs, 5, 2)).toBe(true);

    // Two isolated corners: no domino fits
    const corners = frameWithHoles(2, 6, [
      [2, 2],
      [6, 6],
    ]);
    expect(canKingdomFitDominoes(corners, 5, 1)).toBe(false);

    // A 2x2 hole: 2 dominoes fit (perfect matching)
    const square = frameWithHoles(2, 6, [
      [2, 2],
      [3, 2],
      [2, 3],
      [3, 3],
    ]);
    expect(canKingdomFitDominoes(square, 5, 2)).toBe(true);
  });

  test("a 7x7 kingdom (Mighty Duel, Queendomino 2 players)", () => {
    expect(canKingdomFitDominoes(kingdomWith([]), 7, 24)).toBe(true);
    const full7 = frameWithHoles(1, 7, [
      [1, 1],
      [7, 7],
    ]);
    expect(canKingdomFitDominoes(full7, 7, 1)).toBe(false);
    expect(canKingdomFitDominoes(full7, 5, 1)).toBe(false);
  });
});
