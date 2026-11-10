import {
  discardFromAgeOfGiantsLine,
  isAgeOfGiantsMode,
  isAgeOfGiantsQueenDominoMode,
  isFootprintDomino,
  isGiantDomino,
} from "@core/domain/entities/ageOfGiantsHelpers.js";
import type { Domino } from "@core/domain/types/domino.js";
import { describe, expect, it } from "vitest";

const makeDomino = (overrides?: Partial<Domino>): Domino => ({
  left: { type: "wheat", crowns: 0 },
  right: { type: "forest", crowns: 1 },
  number: 1,
  ...overrides,
});

describe("isAgeOfGiantsMode", () => {
  it("returns true for AgeOfGiants mode", () => {
    expect(isAgeOfGiantsMode("AgeOfGiants")).toBe(true);
  });

  it("returns true for AgeOfGiants-QueenDomino mode", () => {
    expect(isAgeOfGiantsMode("AgeOfGiants-QueenDomino")).toBe(true);
  });

  it("returns false for Classic mode", () => {
    expect(isAgeOfGiantsMode("Classic")).toBe(false);
  });

  it("returns false for QueenDomino mode", () => {
    expect(isAgeOfGiantsMode("QueenDomino")).toBe(false);
  });

  it("returns false for KingdominoOrigins modes", () => {
    expect(isAgeOfGiantsMode("KingdominoOrigins-Discovery")).toBe(false);
  });
});

describe("isAgeOfGiantsQueenDominoMode", () => {
  it("returns true for AgeOfGiants-QueenDomino", () => {
    expect(isAgeOfGiantsQueenDominoMode("AgeOfGiants-QueenDomino")).toBe(true);
  });

  it("returns false for AgeOfGiants (Classic)", () => {
    expect(isAgeOfGiantsQueenDominoMode("AgeOfGiants")).toBe(false);
  });

  it("returns false for plain QueenDomino", () => {
    expect(isAgeOfGiantsQueenDominoMode("QueenDomino")).toBe(false);
  });
});

describe("isGiantDomino", () => {
  it("returns true when left tile has giant", () => {
    const domino = makeDomino({
      left: { type: "wheat", crowns: 1, hasGiant: true },
    });
    expect(isGiantDomino(domino)).toBe(true);
  });

  it("returns true when right tile has giant", () => {
    const domino = makeDomino({
      right: { type: "forest", crowns: 0, hasGiant: true },
    });
    expect(isGiantDomino(domino)).toBe(true);
  });

  it("returns false for a normal domino", () => {
    expect(isGiantDomino(makeDomino())).toBe(false);
  });

  it("returns false for a footprint domino", () => {
    const domino = makeDomino({
      left: { type: "wheat", crowns: 0, hasFootprint: true },
    });
    expect(isGiantDomino(domino)).toBe(false);
  });
});

describe("isFootprintDomino", () => {
  it("returns true when left tile has footprint", () => {
    const domino = makeDomino({
      left: { type: "plain", crowns: 1, hasFootprint: true },
    });
    expect(isFootprintDomino(domino)).toBe(true);
  });

  it("returns true when right tile has footprint", () => {
    const domino = makeDomino({
      right: { type: "mine", crowns: 2, hasFootprint: true },
    });
    expect(isFootprintDomino(domino)).toBe(true);
  });

  it("returns false for a normal domino", () => {
    expect(isFootprintDomino(makeDomino())).toBe(false);
  });

  it("returns false for a giant domino", () => {
    const domino = makeDomino({
      right: { type: "forest", crowns: 1, hasGiant: true },
    });
    expect(isFootprintDomino(domino)).toBe(false);
  });
});

describe("discardFromAgeOfGiantsLine (official discard positions)", () => {
  // Sorted line: letter dominoes A (0.01) and B (0.02) come first
  const line = [0.01, 0.02, 7, 21, 51];

  it("5 players: nothing is discarded", () => {
    expect(discardFromAgeOfGiantsLine(line, 0)).toEqual(line);
  });

  it("2 or 4 players: the middle (3rd) domino is discarded", () => {
    expect(discardFromAgeOfGiantsLine(line, 1)).toEqual([0.01, 0.02, 21, 51]);
  });

  it("3 players: the 2nd and 4th dominoes are discarded", () => {
    expect(discardFromAgeOfGiantsLine(line, 2)).toEqual([0.01, 7, 51]);
  });

  it("giant dominoes at the head of the line are kept", () => {
    const giants = [0.01, 0.02, 0.03, 0.04, 30];
    expect(discardFromAgeOfGiantsLine(giants, 1)).toEqual([
      0.01, 0.02, 0.04, 30,
    ]);
    expect(discardFromAgeOfGiantsLine(giants, 2)).toEqual([0.01, 0.03, 30]);
  });

  it("does not mutate the input line", () => {
    const copy = [...line];
    discardFromAgeOfGiantsLine(line, 2);
    expect(line).toEqual(copy);
  });
});
