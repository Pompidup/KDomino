import {
  createEmptyKingdom,
  placeCastle,
} from "../../core/domain/entities/kingdom.js";
import type { Player } from "../../core/domain/types/player.js";

const kingdom = createEmptyKingdom();

const defaultPlayer: Player = {
  id: "default-id",
  name: "player",
  kingdom: placeCastle(kingdom),
};

export const createPlayerBuilder = (player: Partial<Player> = {}) => ({
  withId: (id: string) => createPlayerBuilder({ ...player, id }),
  withName: (name: string) => createPlayerBuilder({ ...player, name }),
  withKingdom: (kingdom: Player["kingdom"]) =>
    createPlayerBuilder({ ...player, kingdom }),
  build: () =>
    ({
      ...defaultPlayer,
      ...player,
    } as Player),
});
