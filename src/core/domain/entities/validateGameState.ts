import { GROUND } from "@core/domain/types/domino.js";
import type { Game } from "@core/domain/types/game.js";
import { gameSteps } from "@core/domain/types/game.js";
import { GRIDSIZE } from "@core/domain/types/kingdom.js";
import { playerActions } from "@core/domain/types/player.js";
import type {
  ValidationIssue,
  ValidationSeverity,
} from "@core/domain/types/validation.js";

const issue = (
  path: string,
  code: string,
  message: string,
  severity: ValidationSeverity = "error",
): ValidationIssue => ({ path, code, message, severity });

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

const validGrounds = new Set<string>([...GROUND, "empty"]);
const validPlayerActions = new Set<string>(Object.values(playerActions));
const validGameSteps = new Set<string>(Object.values(gameSteps));

// --- Validation sub-functions ---

const validateGameStructure = (game: Game): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  if (!isNonEmptyString(game.id)) {
    issues.push(
      issue("id", "INVALID_ID", "Game id must be a non-empty string"),
    );
  }
  if (!isNonNegativeInteger(game.turn)) {
    issues.push(
      issue("turn", "INVALID_TURN", "Turn must be a non-negative integer"),
    );
  }
  if (!Array.isArray(game.dominoes)) {
    issues.push(
      issue("dominoes", "INVALID_DOMINOES", "Dominoes must be an array"),
    );
  }
  if (!Array.isArray(game.currentDominoes)) {
    issues.push(
      issue(
        "currentDominoes",
        "INVALID_CURRENT_DOMINOES",
        "CurrentDominoes must be an array",
      ),
    );
  }
  if (!Array.isArray(game.players)) {
    issues.push(
      issue("players", "INVALID_PLAYERS", "Players must be an array"),
    );
  }
  if (!Array.isArray(game.lords)) {
    issues.push(issue("lords", "INVALID_LORDS", "Lords must be an array"));
  }
  if (!game.rules || typeof game.rules !== "object") {
    issues.push(issue("rules", "INVALID_RULES", "Rules must be an object"));
  } else {
    if (!game.rules.basic || typeof game.rules.basic !== "object") {
      issues.push(
        issue(
          "rules.basic",
          "INVALID_BASIC_RULES",
          "Rules.basic must be an object",
        ),
      );
    }
    if (!Array.isArray(game.rules.extra)) {
      issues.push(
        issue(
          "rules.extra",
          "INVALID_EXTRA_RULES",
          "Rules.extra must be an array",
        ),
      );
    }
  }
  if (!game.mode || typeof game.mode !== "object") {
    issues.push(issue("mode", "INVALID_MODE", "Mode must be an object"));
  } else {
    if (!isNonEmptyString(game.mode.name)) {
      issues.push(
        issue(
          "mode.name",
          "INVALID_MODE_NAME",
          "Mode name must be a non-empty string",
        ),
      );
    }
  }
  if (!game.nextAction || typeof game.nextAction !== "object") {
    issues.push(
      issue(
        "nextAction",
        "INVALID_NEXT_ACTION",
        "NextAction must be an object",
      ),
    );
  } else if (
    game.nextAction.type !== "action" &&
    game.nextAction.type !== "step"
  ) {
    issues.push(
      issue(
        "nextAction.type",
        "INVALID_NEXT_ACTION_TYPE",
        "NextAction.type must be 'action' or 'step'",
      ),
    );
  }

  return issues;
};

const validateTile = (tile: unknown, path: string): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  if (!tile || typeof tile !== "object") {
    issues.push(
      issue(path, "INVALID_TILE", `Tile at ${path} must be an object`),
    );
    return issues;
  }
  const t = tile as Record<string, unknown>;
  if (typeof t.type !== "string" || !validGrounds.has(t.type)) {
    issues.push(
      issue(
        `${path}.type`,
        "INVALID_TILE_TYPE",
        `Invalid terrain type at ${path}`,
      ),
    );
  }
  if (typeof t.crowns !== "number" || t.crowns < 0) {
    issues.push(
      issue(
        `${path}.crowns`,
        "INVALID_TILE_CROWNS",
        `Invalid crowns at ${path}`,
      ),
    );
  }
  return issues;
};

const validatePlayers = (game: Game): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  if (!Array.isArray(game.players)) return issues;

  const playerIds = new Set<string>();
  for (let i = 0; i < game.players.length; i++) {
    const player = game.players[i]!;
    const path = `players[${i}]`;

    if (!isNonEmptyString(player.id)) {
      issues.push(
        issue(
          `${path}.id`,
          "INVALID_PLAYER_ID",
          `Player id must be a non-empty string`,
        ),
      );
    } else if (playerIds.has(player.id)) {
      issues.push(
        issue(
          `${path}.id`,
          "DUPLICATE_PLAYER_ID",
          `Duplicate player id: ${player.id}`,
        ),
      );
    } else {
      playerIds.add(player.id);
    }

    if (typeof player.name !== "string" || player.name.length < 3) {
      issues.push(
        issue(
          `${path}.name`,
          "INVALID_PLAYER_NAME",
          `Player name must be at least 3 characters`,
        ),
      );
    }

    // Kingdom validation
    if (!Array.isArray(player.kingdom)) {
      issues.push(
        issue(
          `${path}.kingdom`,
          "INVALID_KINGDOM",
          `Kingdom must be a 2D array`,
        ),
      );
      continue;
    }
    if (player.kingdom.length !== GRIDSIZE) {
      issues.push(
        issue(
          `${path}.kingdom`,
          "INVALID_KINGDOM_GRID",
          `Kingdom must have ${GRIDSIZE} rows, got ${player.kingdom.length}`,
        ),
      );
      continue;
    }

    let castleCount = 0;
    for (let y = 0; y < player.kingdom.length; y++) {
      const row = player.kingdom[y]!;
      if (!Array.isArray(row) || row.length !== GRIDSIZE) {
        issues.push(
          issue(
            `${path}.kingdom[${y}]`,
            "INVALID_KINGDOM_ROW",
            `Kingdom row ${y} must have ${GRIDSIZE} columns`,
          ),
        );
        continue;
      }
      for (let x = 0; x < row.length; x++) {
        const cell = row[x]!;
        issues.push(...validateTile(cell, `${path}.kingdom[${y}][${x}]`));
        if (
          cell &&
          typeof cell === "object" &&
          (cell as Record<string, unknown>).type === "castle"
        ) {
          castleCount++;
        }
      }
    }
    if (castleCount === 0) {
      issues.push(
        issue(
          `${path}.kingdom`,
          "MISSING_CASTLE",
          `Kingdom must have exactly one castle tile`,
          "warning",
        ),
      );
    } else if (castleCount > 1) {
      issues.push(
        issue(
          `${path}.kingdom`,
          "MULTIPLE_CASTLES",
          `Kingdom has ${castleCount} castle tiles, expected 1`,
        ),
      );
    }
  }

  return issues;
};

const validateDominoes = (game: Game): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const allNumbers = new Set<number>();

  // Validate draw pile dominoes
  if (Array.isArray(game.dominoes)) {
    for (let i = 0; i < game.dominoes.length; i++) {
      const domino = game.dominoes[i]!;
      const path = `dominoes[${i}]`;

      if (!isPositiveInteger(domino.number)) {
        issues.push(
          issue(
            `${path}.number`,
            "INVALID_DOMINO_NUMBER",
            `Domino number must be a positive integer`,
          ),
        );
      } else if (allNumbers.has(domino.number)) {
        issues.push(
          issue(
            `${path}.number`,
            "DUPLICATE_DOMINO_NUMBER",
            `Duplicate domino number: ${domino.number}`,
          ),
        );
      } else {
        allNumbers.add(domino.number);
      }
      issues.push(...validateTile(domino.left, `${path}.left`));
      issues.push(...validateTile(domino.right, `${path}.right`));
    }
  }

  // Validate current (revealed) dominoes
  if (Array.isArray(game.currentDominoes)) {
    for (let i = 0; i < game.currentDominoes.length; i++) {
      const revealed = game.currentDominoes[i]!;
      const path = `currentDominoes[${i}]`;

      if (!revealed.domino || typeof revealed.domino !== "object") {
        issues.push(
          issue(
            `${path}.domino`,
            "INVALID_REVEALED_DOMINO",
            `Revealed domino must be an object`,
          ),
        );
        continue;
      }

      const domino = revealed.domino;
      if (!isPositiveInteger(domino.number)) {
        issues.push(
          issue(
            `${path}.domino.number`,
            "INVALID_DOMINO_NUMBER",
            `Domino number must be a positive integer`,
          ),
        );
      } else if (allNumbers.has(domino.number)) {
        issues.push(
          issue(
            `${path}.domino.number`,
            "DUPLICATE_DOMINO_NUMBER",
            `Duplicate domino number: ${domino.number}`,
          ),
        );
      } else {
        allNumbers.add(domino.number);
      }
      issues.push(...validateTile(domino.left, `${path}.domino.left`));
      issues.push(...validateTile(domino.right, `${path}.domino.right`));

      // picked/lordId consistency
      if (revealed.picked && revealed.lordId === null) {
        issues.push(
          issue(
            `${path}`,
            "PICKED_WITHOUT_LORD",
            `Domino is marked as picked but has no lordId`,
          ),
        );
      }
      if (!revealed.picked && revealed.lordId !== null) {
        issues.push(
          issue(
            `${path}`,
            "UNPICKED_WITH_LORD",
            `Domino is not picked but has a lordId`,
          ),
        );
      }
    }
  }

  // Validate dominos picked by lords
  // Note: lord.dominoPicked is a copy of the domino from currentDominoes,
  // so the same number legitimately appears in both places.
  if (Array.isArray(game.lords)) {
    const lordPickedNumbers = new Set<number>();
    for (let i = 0; i < game.lords.length; i++) {
      const lord = game.lords[i]!;
      if (lord.dominoPicked) {
        const path = `lords[${i}].dominoPicked`;
        const domino = lord.dominoPicked;
        if (!isPositiveInteger(domino.number)) {
          issues.push(
            issue(
              `${path}.number`,
              "INVALID_DOMINO_NUMBER",
              `Domino number must be a positive integer`,
            ),
          );
        } else if (lordPickedNumbers.has(domino.number)) {
          issues.push(
            issue(
              `${path}.number`,
              "DUPLICATE_DOMINO_NUMBER",
              `Duplicate domino number among lords: ${domino.number}`,
            ),
          );
        } else {
          lordPickedNumbers.add(domino.number);
        }
        issues.push(...validateTile(domino.left, `${path}.left`));
        issues.push(...validateTile(domino.right, `${path}.right`));
      }
    }
  }

  return issues;
};

const validateLords = (game: Game): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  if (!Array.isArray(game.lords)) return issues;

  const playerIds = new Set<string>(
    Array.isArray(game.players) ? game.players.map((p) => p.id) : [],
  );
  const lordIds = new Set<string>();

  for (let i = 0; i < game.lords.length; i++) {
    const lord = game.lords[i]!;
    const path = `lords[${i}]`;

    if (!isNonEmptyString(lord.id)) {
      issues.push(
        issue(
          `${path}.id`,
          "INVALID_LORD_ID",
          `Lord id must be a non-empty string`,
        ),
      );
    } else if (lordIds.has(lord.id)) {
      issues.push(
        issue(
          `${path}.id`,
          "DUPLICATE_LORD_ID",
          `Duplicate lord id: ${lord.id}`,
        ),
      );
    } else {
      lordIds.add(lord.id);
    }

    if (!isNonEmptyString(lord.playerId)) {
      issues.push(
        issue(
          `${path}.playerId`,
          "INVALID_LORD_PLAYER_ID",
          `Lord playerId must be a non-empty string`,
        ),
      );
    } else if (playerIds.size > 0 && !playerIds.has(lord.playerId)) {
      issues.push(
        issue(
          `${path}.playerId`,
          "LORD_PLAYER_NOT_FOUND",
          `Lord references non-existent player: ${lord.playerId}`,
        ),
      );
    }

    if (lord.turnEnded && (!lord.hasPick || !lord.hasPlace)) {
      issues.push(
        issue(
          path,
          "INCONSISTENT_LORD_FLAGS",
          `Lord has turnEnded=true but hasPick=${lord.hasPick}, hasPlace=${lord.hasPlace}`,
          "warning",
        ),
      );
    }
  }

  return issues;
};

const validateGameFlow = (game: Game): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  if (!game.nextAction || typeof game.nextAction !== "object") return issues;

  const nextAction = game.nextAction;

  if (nextAction.type === "action") {
    const action = nextAction as {
      type: "action";
      nextLord?: unknown;
      nextAction?: unknown;
    };

    if (!isNonEmptyString(action.nextLord)) {
      issues.push(
        issue(
          "nextAction.nextLord",
          "INVALID_NEXT_LORD",
          "nextLord must be a non-empty string",
        ),
      );
    } else if (
      Array.isArray(game.lords) &&
      !game.lords.some((l) => l.id === action.nextLord)
    ) {
      issues.push(
        issue(
          "nextAction.nextLord",
          "NEXT_LORD_NOT_FOUND",
          `nextLord references non-existent lord: ${action.nextLord as string}`,
        ),
      );
    }

    if (
      typeof action.nextAction !== "string" ||
      !validPlayerActions.has(action.nextAction as string)
    ) {
      issues.push(
        issue(
          "nextAction.nextAction",
          "INVALID_PLAYER_ACTION",
          `nextAction must be one of: ${[...validPlayerActions].join(", ")}`,
        ),
      );
    }
  } else if (nextAction.type === "step") {
    const step = nextAction as { type: "step"; step?: unknown };

    if (
      typeof step.step !== "string" ||
      !validGameSteps.has(step.step as string)
    ) {
      issues.push(
        issue(
          "nextAction.step",
          "INVALID_GAME_STEP",
          `step must be one of: ${[...validGameSteps].join(", ")}`,
        ),
      );
    }
  }

  return issues;
};

const isSetupPhase = (game: Game): boolean => {
  if (game.nextAction?.type !== "step") return false;
  const step = (game.nextAction as { step: string }).step;
  return step === "addPlayers" || step === "options" || step === "start";
};

const validateRules = (game: Game): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  if (!game.rules || typeof game.rules !== "object") return issues;

  // During setup phases (before players are added), basic rules may have zero values
  const allowZero = isSetupPhase(game);

  const basic = game.rules.basic;
  if (basic && typeof basic === "object") {
    const fields = [
      "lords",
      "maxDominoes",
      "dominoesPerTurn",
      "maxTurns",
      "maxKingdomSize",
    ] as const;
    for (const field of fields) {
      const check = allowZero ? isNonNegativeInteger : isPositiveInteger;
      if (!check(basic[field])) {
        issues.push(
          issue(
            `rules.basic.${field}`,
            "INVALID_BASIC_RULE_VALUE",
            `rules.basic.${field} must be a positive integer`,
          ),
        );
      }
    }
  }

  if (Array.isArray(game.rules.extra)) {
    for (let i = 0; i < game.rules.extra.length; i++) {
      const rule = game.rules.extra[i]!;
      if (!isNonEmptyString(rule.name)) {
        issues.push(
          issue(
            `rules.extra[${i}].name`,
            "INVALID_EXTRA_RULE_NAME",
            `Extra rule name must be a non-empty string`,
          ),
        );
      }
    }
  }

  return issues;
};

/**
 * Validates the integrity of a game state.
 *
 * Use this function after deserializing or restoring a persisted game state
 * to detect corruptions before resuming gameplay.
 *
 * @param game - The game state to validate
 * @returns An array of validation issues. Empty array means the state is valid.
 *
 * @example
 * ```typescript
 * const issues = validateGameState(game);
 * if (issues.length > 0) {
 *   console.error("Game state is corrupted:", issues);
 * }
 * ```
 */
export const validateGameState = (game: Game): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  issues.push(...validateGameStructure(game));
  issues.push(...validatePlayers(game));
  issues.push(...validateDominoes(game));
  issues.push(...validateLords(game));
  issues.push(...validateGameFlow(game));
  issues.push(...validateRules(game));

  return issues;
};
