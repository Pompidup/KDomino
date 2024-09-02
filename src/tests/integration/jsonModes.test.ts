import { describe, test, expect } from "vitest";
import jsonModes from "../../adapterServerside/jsonModes";

describe("jsonModes", () => {
  test("should return available game modes", () => {
    // Arrange
    const repository = jsonModes();

    // Act
    const result = repository.getAvailables();

    // Assert
    expect(result.length).toBe(1);
  });
});
