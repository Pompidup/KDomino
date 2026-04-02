import {
  calculateLocalTradeBonus,
  calculateKingdomBordersBonus,
  calculateLostCornerBonus,
  calculateMegalomaniaBonus,
  calculateAustereKingBonus,
  calculateQuestBonus,
} from "@core/domain/entities/questScore.js";
import type { QuestTile } from "@core/domain/types/ageOfGiants.js";
import { GRIDSIZE } from "@core/domain/types/kingdom.js";
import { describe, expect, it } from "vitest";

const emptyKingdom = () =>
  Array.from({ length: GRIDSIZE }, () =>
    Array.from({ length: GRIDSIZE }, () => ({
      type: "empty" as const,
      crowns: 0 as const,
    })),
  );

const makeKingdomWithCastle = () => {
  const k = emptyKingdom();
  k[4]![4] = { type: "castle" as const, crowns: 0 };
  return k;
};

describe("calculateLocalTradeBonus", () => {
  it("returns 0 for empty kingdom", () => {
    expect(calculateLocalTradeBonus(emptyKingdom(), "wheat", 5)).toBe(0);
  });

  it("scores matching tiles adjacent to castle (all 8 directions)", () => {
    const k = makeKingdomWithCastle();
    // Place wheat in all 8 adjacent positions
    k[3]![3] = { type: "wheat", crowns: 0 };
    k[3]![4] = { type: "wheat", crowns: 0 };
    k[3]![5] = { type: "wheat", crowns: 0 };
    k[4]![3] = { type: "wheat", crowns: 0 };
    k[4]![5] = { type: "wheat", crowns: 0 };
    k[5]![3] = { type: "wheat", crowns: 0 };
    k[5]![4] = { type: "wheat", crowns: 0 };
    k[5]![5] = { type: "wheat", crowns: 0 };

    expect(calculateLocalTradeBonus(k, "wheat", 5)).toBe(40); // 8 × 5
  });

  it("only counts matching terrain type", () => {
    const k = makeKingdomWithCastle();
    k[3]![4] = { type: "wheat", crowns: 0 };
    k[4]![3] = { type: "forest", crowns: 0 };
    k[5]![4] = { type: "wheat", crowns: 0 };

    expect(calculateLocalTradeBonus(k, "wheat", 5)).toBe(10); // 2 × 5
  });
});

describe("calculateKingdomBordersBonus", () => {
  it("returns 0 for empty kingdom", () => {
    expect(calculateKingdomBordersBonus(emptyKingdom(), "wheat", 5)).toBe(0);
  });

  it("scores matching tiles in corners of bounding box", () => {
    const k = emptyKingdom();
    k[2]![2] = { type: "wheat", crowns: 0 }; // top-left corner
    k[2]![6] = { type: "wheat", crowns: 0 }; // top-right corner
    k[6]![2] = { type: "forest", crowns: 0 }; // bottom-left (wrong terrain)
    k[6]![6] = { type: "wheat", crowns: 0 }; // bottom-right corner

    expect(calculateKingdomBordersBonus(k, "wheat", 5)).toBe(15); // 3 × 5
  });
});

describe("calculateLostCornerBonus", () => {
  it("returns 0 when castle is in center", () => {
    const k = makeKingdomWithCastle();
    k[2]![2] = { type: "wheat", crowns: 0 };
    k[6]![6] = { type: "wheat", crowns: 0 };

    expect(calculateLostCornerBonus(k, 20)).toBe(0);
  });

  it("returns points when castle is in top-left corner of bounding box", () => {
    const k = emptyKingdom();
    k[2]![2] = { type: "castle", crowns: 0 };
    k[2]![6] = { type: "wheat", crowns: 0 };
    k[6]![2] = { type: "forest", crowns: 0 };
    k[6]![6] = { type: "sea", crowns: 0 };

    expect(calculateLostCornerBonus(k, 20)).toBe(20);
  });

  it("returns points when castle is in bottom-right corner", () => {
    const k = emptyKingdom();
    k[2]![2] = { type: "wheat", crowns: 0 };
    k[6]![6] = { type: "castle", crowns: 0 };

    expect(calculateLostCornerBonus(k, 20)).toBe(20);
  });
});

describe("calculateMegalomaniaBonus", () => {
  it("returns 0 when no alignments exist", () => {
    const k = makeKingdomWithCastle();
    k[3]![3] = { type: "wheat", crowns: 1 };
    k[5]![5] = { type: "forest", crowns: 1 };

    expect(calculateMegalomaniaBonus(k, [], 10)).toBe(0);
  });

  it("scores horizontal alignment of 3+ crowned tiles", () => {
    const k = makeKingdomWithCastle();
    k[3]![2] = { type: "wheat", crowns: 1 };
    k[3]![3] = { type: "forest", crowns: 1 };
    k[3]![4] = { type: "sea", crowns: 1 };

    expect(calculateMegalomaniaBonus(k, [], 10)).toBe(10);
  });

  it("scores vertical alignment of 3+ crowned tiles", () => {
    const k = makeKingdomWithCastle();
    k[2]![3] = { type: "wheat", crowns: 1 };
    k[3]![3] = { type: "forest", crowns: 1 };
    k[4]![3] = { type: "sea", crowns: 2 };

    expect(calculateMegalomaniaBonus(k, [], 10)).toBe(10);
  });

  it("scores diagonal alignment", () => {
    const k = makeKingdomWithCastle();
    k[2]![2] = { type: "wheat", crowns: 1 };
    k[3]![3] = { type: "forest", crowns: 1 };
    k[4]![4] = { type: "sea", crowns: 1 }; // castle is here, type castle - won't count

    // Castle at 4,4 has type castle, not counted
    // Replace with a non-castle
    k[4]![4] = { type: "mine", crowns: 1 };

    expect(calculateMegalomaniaBonus(k, [], 10)).toBe(10);
  });

  it("excludes crowns covered by giants", () => {
    const k = makeKingdomWithCastle();
    k[3]![2] = { type: "wheat", crowns: 1 };
    k[3]![3] = { type: "forest", crowns: 1 };
    k[3]![4] = { type: "sea", crowns: 1 };

    // Cover the middle crown with a giant
    const giants = [{ position: { x: 3, y: 3 } }];
    expect(calculateMegalomaniaBonus(k, giants, 10)).toBe(0); // alignment broken
  });
});

describe("calculateAustereKingBonus", () => {
  it("returns 0 for small properties", () => {
    const k = makeKingdomWithCastle();
    k[3]![3] = { type: "wheat", crowns: 0 };
    k[3]![4] = { type: "wheat", crowns: 0 };

    expect(calculateAustereKingBonus(k, 10)).toBe(0);
  });

  it("scores properties of 5+ crownless tiles", () => {
    const k = makeKingdomWithCastle();
    k[2]![2] = { type: "wheat", crowns: 0 };
    k[2]![3] = { type: "wheat", crowns: 0 };
    k[2]![4] = { type: "wheat", crowns: 0 };
    k[3]![2] = { type: "wheat", crowns: 0 };
    k[3]![3] = { type: "wheat", crowns: 0 };

    expect(calculateAustereKingBonus(k, 10)).toBe(10);
  });

  it("does not count properties with any crowns", () => {
    const k = makeKingdomWithCastle();
    k[2]![2] = { type: "wheat", crowns: 0 };
    k[2]![3] = { type: "wheat", crowns: 0 };
    k[2]![4] = { type: "wheat", crowns: 1 }; // has a crown
    k[3]![2] = { type: "wheat", crowns: 0 };
    k[3]![3] = { type: "wheat", crowns: 0 };

    expect(calculateAustereKingBonus(k, 10)).toBe(0);
  });

  it("does not count mine or swamp properties", () => {
    const k = makeKingdomWithCastle();
    k[2]![2] = { type: "mine", crowns: 0 };
    k[2]![3] = { type: "mine", crowns: 0 };
    k[2]![4] = { type: "mine", crowns: 0 };
    k[3]![2] = { type: "mine", crowns: 0 };
    k[3]![3] = { type: "mine", crowns: 0 };

    expect(calculateAustereKingBonus(k, 10)).toBe(0);
  });
});

describe("calculateQuestBonus", () => {
  it("dispatches localTrade quest", () => {
    const k = makeKingdomWithCastle();
    k[3]![4] = { type: "wheat", crowns: 0 };
    k[5]![4] = { type: "wheat", crowns: 0 };

    const quest: QuestTile = {
      id: 1,
      type: "localTrade",
      name: "Local Trade - Wheat",
      description: "",
      points: 5,
      terrain: "wheat",
    };

    expect(calculateQuestBonus(quest, k, [], 48, 4)).toBe(10);
  });

  it("dispatches middleKingdom quest", () => {
    const k = makeKingdomWithCastle();
    // Build a 5x5 grid centered on 4,4
    for (let y = 2; y <= 6; y++) {
      for (let x = 2; x <= 6; x++) {
        if (k[y]![x]!.type === "empty") {
          k[y]![x] = { type: "wheat", crowns: 0 };
        }
      }
    }

    const quest: QuestTile = {
      id: 10,
      type: "middleKingdom",
      name: "Middle Kingdom",
      description: "",
      points: 10,
    };

    expect(calculateQuestBonus(quest, k, [], 48, 4)).toBe(10);
  });
});
