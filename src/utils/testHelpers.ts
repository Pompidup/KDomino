import type { Ok, Err } from "./result.js";

export const unwrap = <T>(result: Ok<T> | Err): T => {
  if (result.tag === "Err") {
    throw result.error;
  }
  return result.value;
};
