import { type Result, err, ok, isErr } from "../../../utils/result.js";
import type { PlayerPayload, Player } from "../types/player.js";
import type { Kingdom } from "../types/kingdom.js";

const MINPLAYERSNAMELENGTH = 3;

export const validatePlayer = (name: string): Result<string> => {
  if (!name || name.trim().length < MINPLAYERSNAMELENGTH) {
    return err(`Invalid player name: ${name}`);
  }

  return ok(name);
};

export const createPlayer = (
  playerName: string,
  id: string,
  kingdom: Kingdom
): Result<Player> => {
  const name = validatePlayer(playerName);

  if (isErr(name)) {
    return name;
  }

  return ok({
    name: name.value,
    id,
    kingdom,
  });
};
