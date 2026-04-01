import type { UuidMethod } from "@core/portServerside/uuidMethod.js";

export const uuidMethod: UuidMethod = () => {
  return globalThis.crypto.randomUUID();
};
