import type { UuidMethod } from "@core/portServerside/uuidMethod.js";
import { randomUUID } from "crypto";

export const uuidMethod: UuidMethod = () => {
  return randomUUID();
};
