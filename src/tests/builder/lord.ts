import type { Lord } from "../../core/domain/types/lord.js";

const defaultLord: Lord = {
  id: "default-id",
  playerId: "default-player-id",
  turnEnded: false,
  hasPick: false,
  hasPlace: false,
};

export const createLordBuilder = (lord: Partial<Lord> = {}) => ({
  withId: (id: string) => createLordBuilder({ ...lord, id }),
  withPlayerId: (playerId: string) => createLordBuilder({ ...lord, playerId }),
  withTurnEnded: (turnEnded: boolean) =>
    createLordBuilder({ ...lord, turnEnded }),
  withHasPick: (hasPick: boolean) => createLordBuilder({ ...lord, hasPick }),
  withHasPlace: (hasPlace: boolean) => createLordBuilder({ ...lord, hasPlace }),
  withDominoPicked: (dominoPicked: Lord["dominoPicked"]) =>
    createLordBuilder({ ...lord, dominoPicked }),
  build: () =>
    ({
      ...JSON.parse(JSON.stringify(defaultLord)),
      ...JSON.parse(JSON.stringify(lord)),
    } as Lord),
});
