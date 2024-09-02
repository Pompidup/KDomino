import type { NextAction } from "../types/game.js";
import type { Lord } from "../types/lord.js";
import { playerActions, type PlayerActions } from "../types/player.js";

export const createLord = (id: string, playerId: string): Lord => {
  return {
    id,
    playerId,
    turnEnded: false,
    hasPick: false,
    hasPlace: true,
  };
};

const hasPick = (lord: Lord): boolean => lord.hasPick;
const hasPlace = (lord: Lord): boolean => lord.hasPlace;
const hasTurnEnded = (lord: Lord): boolean => lord.turnEnded;

export const canPass = (lord: Lord): boolean => {
  return !hasPick(lord) && !hasPlace(lord) && !hasTurnEnded(lord);
};

export const canPick = (lord: Lord): boolean => {
  return !hasPick(lord) && hasPlace(lord) && !hasTurnEnded(lord);
};

export const canPlaceAndDominoPickedIsDefined = (
  lord: Lord
): lord is Required<Lord & Pick<Lord, "dominoPicked">> => {
  return (
    !hasPick(lord) &&
    !hasPlace(lord) &&
    !hasTurnEnded(lord) &&
    lord.dominoPicked !== undefined
  );
};

export const updateLordOrder = (lords: Lord[]): Lord[] => {
  return lords.sort((a, b) => {
    return a.dominoPicked!.number - b.dominoPicked!.number;
  });
};

export const resetLordsActions = (lord: Lord[]): Lord[] => {
  const lordsCopy = [...lord];
  for (const lord of lordsCopy) {
    lord.turnEnded = false;
    lord.hasPick = false;
    lord.hasPlace = false;
  }

  return lordsCopy;
};

export const nextLordWithAction = (lords: Lord[]): NextAction => {
  const nextLord = findNextLord(lords);

  return {
    type: "action",
    nextLord: nextLord.id,
    nextAction: hasPlace(nextLord)
      ? playerActions.pickDomino
      : playerActions.placeDomino,
  };
};

const findNextLord = (lords: Lord[]): Lord => {
  const lord = lords.find((lord) => !hasTurnEnded(lord));
  if (!lord) {
    return lords[0]!;
  }
  return lord;
};

export const allLordsHavePlayed = (lords: Lord[]) => {
  return lords.every((lord) => lord.turnEnded);
};
