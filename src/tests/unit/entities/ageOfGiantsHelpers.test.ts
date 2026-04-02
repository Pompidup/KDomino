import {
  isAgeOfGiantsMode,
  isAgeOfGiantsQueenDominoMode,
  isGiantDomino,
  isFootprintDomino,
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
