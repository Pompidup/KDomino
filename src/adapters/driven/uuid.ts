import type { UuidMethod } from "../../hexagon/ports/driven/uuidMethod.js";
import { randomUUID } from "crypto";

export const uuidMethod: UuidMethod = () => {
  return randomUUID();
};
