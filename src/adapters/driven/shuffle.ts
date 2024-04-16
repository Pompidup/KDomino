import type { ShuffleMethod } from "../../hexagon/ports/driven/shuffleMethod";

export const shuffleMethod: ShuffleMethod = <T>(array: T[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j] as T, array[i] as T];
  }
  return array;
};
