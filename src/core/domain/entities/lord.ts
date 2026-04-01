import type { NextAction } from "@core/domain/types/game.js";
import type { Lord } from "@core/domain/types/lord.js";
import { type PlayerActions, playerActions } from "@core/domain/types/player.js";

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
  return [...lords].sort((a, b) => {
    return (a.dominoPicked?.number ?? 0) - (b.dominoPicked?.number ?? 0);
  });
};

export const resetLordsActions = (lords: Lord[]): Lord[] => {
  return lords.map((lord) => ({
    ...lord,
    turnEnded: false,
    hasPick: false,
    hasPlace: false,
  }));
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

export const allLordsHavePlayed = (lords: Lord[]): boolean => {
  return lords.every((lord) => lord.turnEnded);
};

/**
 * Queendomino optional action sequence after placeDomino:
 * placeKnight → constructBuilding → useDragon → pickDomino
 *
 * Given the current optional action, returns the next one in the sequence.
 */
const QUEENDOMINO_ACTION_SEQUENCE: PlayerActions[] = [
  playerActions.placeKnight,
  playerActions.constructBuilding,
  playerActions.useDragon,
  playerActions.pickDomino,
];

export const nextQueenDominoAction = (
  currentAction: PlayerActions,
): PlayerActions => {
  const index = QUEENDOMINO_ACTION_SEQUENCE.indexOf(currentAction);
  if (index === -1 || index >= QUEENDOMINO_ACTION_SEQUENCE.length - 1) {
    return playerActions.pickDomino;
  }
  return QUEENDOMINO_ACTION_SEQUENCE[index + 1]!;
};
