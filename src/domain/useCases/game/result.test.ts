import { describe, expect, test } from "vitest";
import { result as usecase } from "./result.js";

describe("Game Result", () => {
  test("should return player ranking, decide on score (no tie)", async () => {
    // Arrange
    const scores = [
      {
        playerId: "uuid-1",
        playerName: "Player 1",
        details: {
          score: 5,
          maxPropertiesSize: 5,
          totalCrowns: 1,
        },
      },
      {
        playerId: "uuid-2",
        playerName: "Player 2",
        details: {
          score: 10,
          maxPropertiesSize: 10,
          totalCrowns: 1,
        },
      },
    ];

    const expectedResult = [
      {
        position: 1,
        playerId: "uuid-2",
        playerName: "Player 2",
        details: {
          score: 10,
          maxPropertiesSize: 10,
          totalCrowns: 1,
        },
      },
      {
        position: 2,
        playerId: "uuid-1",
        playerName: "Player 1",
        details: {
          score: 5,
          maxPropertiesSize: 5,
          totalCrowns: 1,
        },
      },
    ];

    // Act
    const result = usecase(scores);

    // Assert
    expect(result).toEqual(expectedResult);
  });

  test("should return player ranking with tie, decide on maxPropertiesSize", async () => {
    // Arrange
    const scores = [
      {
        playerId: "uuid-1",
        playerName: "Player 1",
        details: {
          score: 10,
          maxPropertiesSize: 5,
          totalCrowns: 2,
        },
      },
      {
        playerId: "uuid-2",
        playerName: "Player 2",
        details: {
          score: 10,
          maxPropertiesSize: 10,
          totalCrowns: 1,
        },
      },
    ];

    const expectedResult = [
      {
        position: 1,
        playerId: "uuid-2",
        playerName: "Player 2",
        details: {
          score: 10,
          maxPropertiesSize: 10,
          totalCrowns: 1,
        },
      },
      {
        position: 2,
        playerId: "uuid-1",
        playerName: "Player 1",
        details: {
          score: 10,
          maxPropertiesSize: 5,
          totalCrowns: 2,
        },
      },
    ];
    // Act
    const result = usecase(scores);

    // Assert
    expect(result).toEqual(expectedResult);
  });

  test("should return player ranking with tie, decide on totalCrowns", async () => {
    // Arrange
    const scores = [
      {
        playerId: "uuid-1",
        playerName: "Player 1",
        details: {
          score: 10,
          maxPropertiesSize: 5,
          totalCrowns: 1,
        },
      },
      {
        playerId: "uuid-2",
        playerName: "Player 2",
        details: {
          score: 10,
          maxPropertiesSize: 5,
          totalCrowns: 2,
        },
      },
    ];

    const expectedResult = [
      {
        position: 1,
        playerId: "uuid-2",
        playerName: "Player 2",
        details: {
          score: 10,
          maxPropertiesSize: 5,
          totalCrowns: 2,
        },
      },
      {
        position: 2,
        playerId: "uuid-1",
        playerName: "Player 1",
        details: {
          score: 10,
          maxPropertiesSize: 5,
          totalCrowns: 1,
        },
      },
    ];
    // Act
    const result = usecase(scores);

    // Assert
    expect(result).toEqual(expectedResult);
  });

  test("should return player ranking with full tie", async () => {
    // Arrange
    const scores = [
      {
        playerId: "uuid-1",
        playerName: "Player 1",
        details: {
          score: 10,
          maxPropertiesSize: 5,
          totalCrowns: 1,
        },
      },
      {
        playerId: "uuid-2",
        playerName: "Player 2",
        details: {
          score: 10,
          maxPropertiesSize: 5,
          totalCrowns: 1,
        },
      },
    ];

    const expectedResult = [
      {
        position: 1,
        playerId: "uuid-1",
        playerName: "Player 1",
        details: {
          score: 10,
          maxPropertiesSize: 5,
          totalCrowns: 1,
        },
      },
      {
        position: 1,
        playerId: "uuid-2",
        playerName: "Player 2",
        details: {
          score: 10,
          maxPropertiesSize: 5,
          totalCrowns: 1,
        },
      },
    ];
    // Act
    const result = usecase(scores);

    // Assert
    expect(result).toEqual(expectedResult);
  });

  test("should shift position if tie", async () => {
    // Arrange
    const scores = [
      {
        playerId: "uuid-1",
        playerName: "Player 1",
        details: {
          score: 10,
          maxPropertiesSize: 5,
          totalCrowns: 1,
        },
      },
      {
        playerId: "uuid-2",
        playerName: "Player 2",
        details: {
          score: 10,
          maxPropertiesSize: 5,
          totalCrowns: 1,
        },
      },
      {
        playerId: "uuid-3",
        playerName: "Player 3",
        details: {
          score: 1,
          maxPropertiesSize: 1,
          totalCrowns: 1,
        },
      },
      {
        playerId: "uuid-4",
        playerName: "Player 4",
        details: {
          score: 2,
          maxPropertiesSize: 2,
          totalCrowns: 1,
        },
      },
    ];

    const expectedResult = [
      {
        position: 1,
        playerId: "uuid-1",
        playerName: "Player 1",
        details: {
          score: 10,
          maxPropertiesSize: 5,
          totalCrowns: 1,
        },
      },
      {
        position: 1,
        playerId: "uuid-2",
        playerName: "Player 2",
        details: {
          score: 10,
          maxPropertiesSize: 5,
          totalCrowns: 1,
        },
      },
      {
        position: 3,
        playerId: "uuid-4",
        playerName: "Player 4",
        details: {
          score: 2,
          maxPropertiesSize: 2,
          totalCrowns: 1,
        },
      },
      {
        position: 4,
        playerId: "uuid-3",
        playerName: "Player 3",
        details: {
          score: 1,
          maxPropertiesSize: 1,
          totalCrowns: 1,
        },
      },
    ];
    // Act
    const result = usecase(scores);

    // Assert
    expect(result).toEqual(expectedResult);
  });
});
