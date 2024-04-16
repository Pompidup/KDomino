import { place as useCase } from "./place.js";
import kingdom, {
  type Orientation,
  type Rotation,
} from "../entities/kingdom.js";
import { playerAction } from "./game.js";
import { describe, test, expect } from "vitest";
import helper from "../../../utils/testHelpers.js";
import inMemoryDominoes from "../../../adapters/driven/inMemoryDominoes.js";

describe("Game Place", () => {
  test("should add domino to kingdom", () => {
    // Arrange
    const setup = helper().setupGame(
      2,
      inMemoryDominoes().getAll(),
      true,
      false
    );

    const payload = {
      lordId: "uuid-4",
      action: playerAction.place,
      data: {
        state: setup,
        position: {
          x: 4,
          y: 3,
        },
        orientation: <Orientation>"horizontal",
        rotation: <Rotation>0,
      },
    };

    // Act
    const state = useCase(payload);

    const expectedKingdom = kingdom.createKingdomWithCastle();

    expectedKingdom[3][4] = {
      type: setup.currentDominoes[3].domino.left.type,
      crowns: setup.currentDominoes[3].domino.left.crowns,
    };

    expectedKingdom[3][5] = {
      type: setup.currentDominoes[3].domino.right.type,
      crowns: setup.currentDominoes[3].domino.right.crowns,
    };

    // Assert
    expect(state.players[1].kingdom).toEqual(expectedKingdom);
    expect(state.lords[3].hasPlace).toEqual(true);
    expect(state.lords[3].turnEnded).toEqual(false);
  });

  test("should throw if not fit grid", () => {
    // Arrange
    const setup = helper().setupGame(
      2,
      inMemoryDominoes().getAll(),
      true,
      false
    );

    setup.players[1].kingdom[4][5] = {
      type: "wheat",
      crowns: 0,
    };
    setup.players[1].kingdom[4][6] = {
      type: "wheat",
      crowns: 1,
    };
    setup.players[1].kingdom[4][7] = {
      type: "wheat",
      crowns: 2,
    };
    setup.players[1].kingdom[5][7] = {
      type: "wheat",
      crowns: 3,
    };

    const payload = {
      lordId: setup.lords[3].id,
      action: playerAction.place,
      data: {
        state: setup,
        position: {
          x: 4,
          y: 8,
        },
        orientation: <Orientation>"horizontal",
        rotation: <Rotation>180,
      },
    };
    // Act
    // Assert
    expect(() => useCase(payload)).toThrow(
      "Invalid placement (not fit into the grid)"
    );
  });
});
