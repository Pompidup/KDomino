import { isValidMode, type AvailableMode } from "./mode.js";

export type Rule = {
  name: string;
  description: string;
  mode: AvailableMode[];
  playersLimit?: number;
};

export const rulesSet: Rule[] = [
  {
    name: "The middle Kingdom",
    description:
      "Gain 10 additional points if your castle is in the middle of the kingdom.",
    mode: ["Classic"],
  },
  {
    name: "Harmony",
    description:
      "Gain 5 additional points if your kingdom is complete (no discarded dominoes).",
    mode: ["Classic"],
  },
  {
    name: "The mighty duel",
    description: "With 2 players, use all dominoes for build a 7x7 kingdom.",
    mode: ["Classic"],
    playersLimit: 2,
  },
  {
    name: "Dynasty",
    description: "Play 3 games in a row with the same players.",
    mode: ["Classic"],
  },
];

const mapModeAndRulesSet = (mode: AvailableMode, numberOfPlayers: number) => {
  return rulesSet
    .filter((rule) => rule.mode.includes(mode))
    .filter(
      (rule) => !rule.playersLimit || rule.playersLimit === numberOfPlayers
    );
};

export const available = (mode: string, numberOfPlayers: number) => {
  if (isValidMode(mode)) {
    return mapModeAndRulesSet(mode, numberOfPlayers);
  }

  return [];
};
