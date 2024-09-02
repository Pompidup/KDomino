import type { Game, NextStep } from "../../core/domain/types/game.js";

export type StartGameCommand = { game: Game & { nextAction: NextStep } };
