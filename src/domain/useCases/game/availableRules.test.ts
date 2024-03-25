import { expect, test, describe } from "vitest";
import { available } from "./availableRules.js";
/* The middle Kingdom
 *
 * Gain 10 additional points if your castle is in the middle of the kingdom.
 *
 */

/* Harmony
 *
 * Gain 5 additional points if your kingdom is complete (no discarded dominoes).
 *
 */

/*  The mighty duel
 *
 * With 2 players
 * Use all dominoes for build a 7x7 kingdom
 *
 */

/* Dynasty
 *
 * Play 3 games in a row with the same players
 *
 */

describe("Available Game rules", () => {
  test("Should give compatible rules available with selected mode", () => {
    // Arrange
    const mode = "Classic";

    // Act
    const rules = available(mode, 2);

    // Assert
    expect(rules).toEqual([
      {
        name: "The middle Kingdom",
        description:
          "Gain 10 additional points if your castle is in the middle of the kingdom.",
        mode: ["Classic"],
      },
      {
        name: "Harmony",
        description:
          "Gain 5 additional points if your kingdom is complete (no discarded dominoes).",
        mode: ["Classic"],
      },
      {
        name: "The mighty duel",
        description:
          "With 2 players, use all dominoes for build a 7x7 kingdom.",
        mode: ["Classic"],
        playersLimit: 2,
      },
      {
        name: "Dynasty",
        description: "Play 3 games in a row with the same players.",
        mode: ["Classic"],
      },
    ]);
  });

  test("Should excluded rules where numbers of players does not match", () => {
    // Arrange
    const mode = "Classic";

    // Act
    const rules = available(mode, 4);

    // Assert
    expect(rules).toEqual([
      {
        name: "The middle Kingdom",
        description:
          "Gain 10 additional points if your castle is in the middle of the kingdom.",
        mode: ["Classic"],
      },
      {
        name: "Harmony",
        description:
          "Gain 5 additional points if your kingdom is complete (no discarded dominoes).",
        mode: ["Classic"],
      },
      {
        name: "Dynasty",
        description: "Play 3 games in a row with the same players.",
        mode: ["Classic"],
      },
    ]);
  });

  test("Should give empty array if mode is not available", () => {
    // Arrange
    const mode = "not-available";

    // Act
    const rules = available(mode, 2);

    // Assert
    expect(rules).toEqual([]);
  });
});
