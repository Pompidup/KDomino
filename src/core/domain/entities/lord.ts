import type { NextAction } from "@core/domain/types/game.js";
import type { Lord } from "@core/domain/types/lord.js";
import {
  type PlayerActions,
  playerActions,
} from "@core/domain/types/player.js";

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
  lord: Lord,
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

/**
 * Age of Giants action sequence after placeDomino (when placeGiant/sendGiant is triggered):
 * placeGiant or sendGiant → pickDomino
 *
 * When combined with QueenDomino:
 * placeGiant or sendGiant → placeKnight → constructBuilding → useDragon → pickDomino
 */
const AOG_QD_ACTION_SEQUENCE: PlayerActions[] = [
  playerActions.placeGiant, // or sendGiant (handled dynamically)
  playerActions.placeKnight,
  playerActions.constructBuilding,
  playerActions.useDragon,
  playerActions.pickDomino,
];

/**
 * Returns the next action after an AoG action.
 * @param currentAction - The current AoG action being completed or skipped
 * @param isQueenDomino - Whether the game combines AoG with QueenDomino
 */
export const nextAgeOfGiantsAction = (
  currentAction: PlayerActions,
  isQueenDomino: boolean,
): PlayerActions => {
  if (!isQueenDomino) {
    // Simple AoG: after giant action, go to pickDomino
    return playerActions.pickDomino;
  }

  // AoG + QueenDomino: use the combined sequence
  const sequence = AOG_QD_ACTION_SEQUENCE;
  // Map sendGiant to the same position as placeGiant in the sequence
  const normalizedAction =
    currentAction === playerActions.sendGiant
      ? playerActions.placeGiant
      : currentAction;

  const index = sequence.indexOf(normalizedAction);
  if (index === -1 || index >= sequence.length - 1) {
    return playerActions.pickDomino;
  }
  return sequence[index + 1]!;
};

/**
 * Origins Discovery/Totem action sequence after placeDomino:
 * placeFireToken → pickDomino
 *
 * In Origins, placing a fire token is optional (only after placing a volcano domino).
 */
const ORIGINS_DISCOVERY_SEQUENCE: PlayerActions[] = [
  playerActions.placeFireToken,
  playerActions.pickDomino,
];

/**
 * Origins Tribe action sequence after placeDomino:
 * placeFireToken → pickDomino → recruitCaveman
 *
 * recruitCaveman happens after picking a new domino (unique to Tribe mode).
 */
const ORIGINS_TRIBE_SEQUENCE: PlayerActions[] = [
  playerActions.placeFireToken,
  playerActions.pickDomino,
  playerActions.recruitCaveman,
];

/**
 * Returns the next Origins action in the sequence.
 * @param currentAction - The current action being completed or skipped
 * @param isTribe - Whether the game is in Tribe mode
 */
export const nextOriginsAction = (
  currentAction: PlayerActions,
  isTribe: boolean,
): PlayerActions => {
  const sequence = isTribe
    ? ORIGINS_TRIBE_SEQUENCE
    : ORIGINS_DISCOVERY_SEQUENCE;
  const index = sequence.indexOf(currentAction);
  if (index === -1 || index >= sequence.length - 1) {
    // Fallback: if we're past the end, signal turn done
    return playerActions.pickDomino;
  }
  return sequence[index + 1]!;
};
