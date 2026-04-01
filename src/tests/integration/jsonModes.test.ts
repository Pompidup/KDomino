import { describe, expect, test } from "vitest";
import jsonModes from "../../adapterServerside/jsonModes";

describe("jsonModes", () => {
  test("should return available game modes", () => {
    // Arrange
    const repository = jsonModes();

    // Act
    const result = repository.getAvailables();

    // Assert
    expect(result.length).toBe(2);
    expect(result.map((m) => m.name)).toContain("Classic");
    expect(result.map((m) => m.name)).toContain("QueenDomino");
  });
});
