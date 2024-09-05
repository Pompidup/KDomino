import type { GameMode } from "@core/domain/types/mode.js";
import type { ModeRepository } from "@core/portServerside/modeRepository.js";
import modesJson from "../datasources/modes.json" assert { type: "json" };

const jsonModes = (): ModeRepository => {
  const modes: GameMode[] = [];

  modesJson.forEach((mode) => {
    modes.push({
      name: mode.name,
      description: mode.description,
    });
  });

  return {
    getAvailables: () => {
      return modes;
    },
  };
};

export default jsonModes;
