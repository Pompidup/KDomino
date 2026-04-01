import { uuidMethod } from "@adapter/uuid.js";
import { describe, expect, it } from "vitest";

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("uuidMethod", () => {
  it("should return a valid UUID v4 string", () => {
    const uuid = uuidMethod();
    expect(uuid).toMatch(UUID_V4_REGEX);
  });

  it("should return unique values on each call", () => {
    const uuids = new Set(Array.from({ length: 100 }, () => uuidMethod()));
    expect(uuids.size).toBe(100);
  });
});
