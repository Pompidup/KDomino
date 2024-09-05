import type {
  GameMode,
  GameWithNextAction,
  GameWithNextStep,
  GameWithResults,
  ExtraRule,
} from "@core/domain/types/index.js";
import type { GetModesCommand } from "@application/commands/getModesCommand.js";
import type { GetExtraRulesCommand } from "@application/commands/getExtraRulesCommand.js";
import type { CreateGameCommand } from "@application/commands/createGameCommand.js";
import type { AddPlayersCommand } from "@application/commands/addPlayersCommand.js";
import type { AddExtraRulesCommand } from "@application/commands/addExtraRulesCommand.js";
import type { StartGameCommand } from "@application/commands/startGameCommand.js";
import type { ChooseDominoCommand } from "@application/commands/chooseDominoCommand.js";
import type { PlaceDominoCommand } from "@application/commands/placeDominoCommand.js";
import type { DiscardDominoCommand } from "@application/commands/discardDominoCommand.js";
import type { GetResultCommand } from "@application/commands/getResultCommand.js";

export type GameEngine = {
  getModes: (command: GetModesCommand) => GameMode[];
  getExtraRules: (command: GetExtraRulesCommand) => ExtraRule[];
  createGame: (command: CreateGameCommand) => GameWithNextStep;
  addPlayers: (command: AddPlayersCommand) => GameWithNextStep;
  addExtraRules: (command: AddExtraRulesCommand) => GameWithNextStep;
  startGame: (command: StartGameCommand) => GameWithNextAction;
  chooseDomino: (command: ChooseDominoCommand) => GameWithNextAction;
  placeDomino: (
    command: PlaceDominoCommand
  ) => GameWithNextAction | GameWithNextStep;
  discardDomino: (
    command: DiscardDominoCommand
  ) => GameWithNextAction | GameWithNextStep;
  getResults: (command: GetResultCommand) => GameWithResults;
};
