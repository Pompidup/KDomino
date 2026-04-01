import {
  checkCastleIsInMiddle,
  createEmptyKingdom,
  getBoundingBox,
  placeCastle,
  placeDomino,
  placeTile,
} from "@core/domain/entities/kingdom.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type { Domino, Tile } from "@core/domain/types/index.js";
import { isErr, isOk } from "@utils/result.js";
import { describe, expect, test } from "vitest";

const wheat: Tile = { type: "wheat", crowns: 0 };
const forest: Tile = { type: "forest", crowns: 0 };

const wheatDomino: Domino = { left: wheat, right: wheat, number: 1 };
const forestDomino: Domino = { left: forest, right: forest, number: 2 };

const buildKingdomWithCastle = () => placeCastle(createEmptyKingdom());

describe("Kingdom - 5x5 constraint", () => {
  test("should allow placement within 5x5 bounds", () => {
    const kingdom = buildKingdomWithCastle();

    // Castle at (4,4), place wheat at (5,4)-(6,4) → bbox 4..6 x 4..4 = 3x1 ✓
    const result = placeDomino(kingdom, { x: 5, y: 4 }, 0, wheatDomino);
    expect(isOk(result)).toBe(true);
  });

  test("should allow placement at the edge of 5x5 bounds", () => {
    // Castle at (4,4). Fill to create a 4-wide kingdom, then place at the 5th column
    let kingdom = buildKingdomWithCastle();
    // Place wheat at (3,4)-(2,4) → bbox x: 2..4
    kingdom = placeTile(kingdom, { x: 3, y: 4 }, wheat);
    kingdom = placeTile(kingdom, { x: 2, y: 4 }, wheat);

    // Place at (5,4)-(6,4) → bbox x: 2..6 = 5 wide ✓
    const result = placeDomino(kingdom, { x: 5, y: 4 }, 0, wheatDomino);
    expect(isOk(result)).toBe(true);
  });

  test("should reject placement that exceeds 5x5 horizontally", () => {
    // Castle at (4,4). Place tiles to span x: 2..5
    let kingdom = buildKingdomWithCastle();
    kingdom = placeTile(kingdom, { x: 3, y: 4 }, wheat);
    kingdom = placeTile(kingdom, { x: 2, y: 4 }, wheat);
    kingdom = placeTile(kingdom, { x: 5, y: 4 }, wheat);
    kingdom = placeTile(kingdom, { x: 6, y: 4 }, wheat);
    // bbox x: 2..6 = 5 wide

    // Place at (7,4)-(8,4) → bbox x: 2..8 = 7 wide ✗
    const result = placeDomino(kingdom, { x: 7, y: 4 }, 0, wheatDomino);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toBe(ErrorCode.PLACEMENT_EXCEEDS_KINGDOM_SIZE);
    }
  });

  test("should reject placement that exceeds 5x5 vertically", () => {
    // Castle at (4,4). Place tiles to span y: 2..6
    let kingdom = buildKingdomWithCastle();
    kingdom = placeTile(kingdom, { x: 4, y: 3 }, wheat);
    kingdom = placeTile(kingdom, { x: 4, y: 2 }, wheat);
    kingdom = placeTile(kingdom, { x: 4, y: 5 }, wheat);
    kingdom = placeTile(kingdom, { x: 4, y: 6 }, wheat);
    // bbox y: 2..6 = 5 tall

    // Place vertically at (5,4)-(5,5) is fine (x: 4..5 = 2, y: 2..6 = 5)
    // But place at (4,7)-(4,8) → bbox y: 2..8 = 7 ✗
    const result = placeDomino(kingdom, { x: 3, y: 7 }, 0, wheatDomino);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toBe(ErrorCode.PLACEMENT_EXCEEDS_KINGDOM_SIZE);
    }
  });

  test("should reject when only one tile of domino exceeds bounds", () => {
    // Castle at (4,4). Tiles at x: 2..5 → bbox 4 wide
    let kingdom = buildKingdomWithCastle();
    kingdom = placeTile(kingdom, { x: 3, y: 4 }, wheat);
    kingdom = placeTile(kingdom, { x: 2, y: 4 }, wheat);
    kingdom = placeTile(kingdom, { x: 5, y: 4 }, wheat);
    kingdom = placeTile(kingdom, { x: 6, y: 4 }, wheat);
    // bbox x: 2..6 = 5

    // Place at (7,3)-(7,4) vertical → first tile x=7 exceeds, bbox x: 2..7 = 6 ✗
    const result = placeDomino(kingdom, { x: 7, y: 3 }, 90, wheatDomino);
    expect(isErr(result)).toBe(true);
  });
});

describe("Kingdom - getBoundingBox", () => {
  test("should return null for empty kingdom", () => {
    const kingdom = createEmptyKingdom();
    expect(getBoundingBox(kingdom)).toBeNull();
  });

  test("should return castle position for kingdom with only castle", () => {
    const kingdom = buildKingdomWithCastle();
    expect(getBoundingBox(kingdom)).toEqual({
      minX: 4,
      maxX: 4,
      minY: 4,
      maxY: 4,
    });
  });

  test("should return correct bounds with placed tiles", () => {
    let kingdom = buildKingdomWithCastle();
    kingdom = placeTile(kingdom, { x: 2, y: 3 }, wheat);
    kingdom = placeTile(kingdom, { x: 6, y: 5 }, wheat);

    expect(getBoundingBox(kingdom)).toEqual({
      minX: 2,
      maxX: 6,
      minY: 3,
      maxY: 5,
    });
  });
});

describe("Kingdom - checkCastleIsInMiddle", () => {
  test("should return true when castle is centered in bounding box", () => {
    // Castle at (4,4), tiles at (2,2)-(6,6) → center = (4,4) ✓
    let kingdom = buildKingdomWithCastle();
    kingdom = placeTile(kingdom, { x: 2, y: 2 }, wheat);
    kingdom = placeTile(kingdom, { x: 6, y: 6 }, wheat);
    expect(checkCastleIsInMiddle(kingdom)).toBe(true);
  });

  test("should return true for castle alone", () => {
    const kingdom = buildKingdomWithCastle();
    // bbox = (4,4)-(4,4), center = (4,4) = castle
    expect(checkCastleIsInMiddle(kingdom)).toBe(true);
  });

  test("should return false when castle is not centered", () => {
    // Castle at (4,4), tiles only to the right → center shifted right
    let kingdom = buildKingdomWithCastle();
    kingdom = placeTile(kingdom, { x: 5, y: 4 }, wheat);
    kingdom = placeTile(kingdom, { x: 6, y: 4 }, wheat);
    // bbox x: 4..6, center x = 5 ≠ 4
    expect(checkCastleIsInMiddle(kingdom)).toBe(false);
  });

  test("should return true with symmetric L-shaped kingdom", () => {
    // Castle at (4,4), tiles symmetric around it
    let kingdom = buildKingdomWithCastle();
    kingdom = placeTile(kingdom, { x: 3, y: 4 }, wheat);
    kingdom = placeTile(kingdom, { x: 5, y: 4 }, wheat);
    kingdom = placeTile(kingdom, { x: 4, y: 3 }, wheat);
    kingdom = placeTile(kingdom, { x: 4, y: 5 }, wheat);
    // bbox (3,3)-(5,5), center = (4,4) ✓
    expect(checkCastleIsInMiddle(kingdom)).toBe(true);
  });

  test("should return true even with gaps if bounding box is centered", () => {
    // Castle at (4,4), corners only
    let kingdom = buildKingdomWithCastle();
    kingdom = placeTile(kingdom, { x: 2, y: 2 }, wheat);
    kingdom = placeTile(kingdom, { x: 6, y: 2 }, wheat);
    kingdom = placeTile(kingdom, { x: 2, y: 6 }, wheat);
    kingdom = placeTile(kingdom, { x: 6, y: 6 }, wheat);
    // bbox (2,2)-(6,6), center = (4,4) ✓ (rules say kingdom may have gaps)
    expect(checkCastleIsInMiddle(kingdom)).toBe(true);
  });

  test("should return false with no castle", () => {
    const kingdom = createEmptyKingdom();
    expect(checkCastleIsInMiddle(kingdom)).toBe(false);
  });
});
