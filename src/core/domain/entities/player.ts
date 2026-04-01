import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import { type Result, err, ok, isErr } from "@utils/result.js";
import type { Player } from "@core/domain/types/player.js";
import type { Kingdom } from "@core/domain/types/kingdom.js";

const MINPLAYERSNAMELENGTH = 3;

export const validatePlayer = (name: string): Result<string> => {
  if (!name || name.trim().length < MINPLAYERSNAMELENGTH) {
    return err(ErrorCode.INVALID_PLAYER_NAME);
  }

  return ok(name);
};

export const createPlayer = (
  playerName: string,
  id: string,
  kingdom: Kingdom,
  bot?: { strategyName: string }
): Result<Player> => {
  const name = validatePlayer(playerName);

  if (isErr(name)) {
    return name;
  }

  return ok({
    name: name.value,
    id,
    kingdom,
    ...(bot && { bot }),
  });
};
