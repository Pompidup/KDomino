/**
 * Reproducible bots (issue #34): with the same seed, the same players and the
 * same moves, every bot decision (every strategy, every mode, extension
 * actions included) is the same from one game to the next, even though the
 * engine generates fresh random ids (game, players, lords) for each game.
 */
import type { PlayerInput } from "@application/commands/addPlayersCommand.js";
import type { GameState } from "@core/domain/types/game.js";
import { playBotTurns } from "@core/useCases/bot.js";
import type { StrategyName } from "@core/useCases/botRegistry.js";
import {
  type ActionEntry,
  type GameActionLog,
  wrapWithActionLog,
} from "@core/useCases/gameActionLog.js";
import { describe, expect, test } from "vitest";
import { createGameEngine } from "../../index.js";

const ALL_MODES = [
  "Classic",
  "QueenDomino",
  "KingdominoOrigins-Discovery",
  "KingdominoOrigins-Totem",
  "KingdominoOrigins-Tribe",
  "AgeOfGiants",
  "AgeOfGiants-QueenDomino",
] as const;

const STRATEGIES: StrategyName[] = ["random", "greedy", "advanced", "expert"];

/**
 * Plays a complete bot-only game on a default engine (random uuids) and
 * returns its action log.
 */
const playLoggedBotGame = (
  mode: string,
  seed: string,
  players: PlayerInput[],
): { log: GameActionLog; game: GameState } => {
  const { engine, getLog } = wrapWithActionLog(createGameEngine({}));
  let game: GameState = engine.createGame({ mode, seed });
  game = engine.addPlayers({ game, players });
  game = engine.startGame({ game });
  game = playBotTurns(engine, game);
  return { log: getLog(), game };
};

/**
 * The log entries without what legitimately differs between two games: the
 * timestamps and the ids the engine generated (game, players, lords), each
 * replaced by its position of first appearance in the log.
 */
const normalizedEntries = (log: GameActionLog): unknown[] => {
  const generated = new Map<string, string>();
  const register = (id: string, kind: string) => {
    if (!generated.has(id)) generated.set(id, `${kind}-${generated.size}`);
  };
  for (const entry of log.entries) {
    if (entry.action === "addPlayers") {
      const { players } = entry.payload as ActionEntry<"addPlayers">["payload"];
      for (const player of players) {
        if (typeof player !== "string" && player.id) {
          register(player.id, "player");
        }
      }
    }
    if (entry.action === "startGame") {
      const { lordIds } = entry.payload as ActionEntry<"startGame">["payload"];
      for (const id of lordIds ?? []) register(id, "lord");
    }
  }
  return log.entries.map(({ timestamp: _timestamp, ...entry }) =>
    JSON.parse(
      JSON.stringify(entry, (key, value) => {
        if (key === "gameId") return undefined;
        return typeof value === "string" && generated.has(value)
          ? generated.get(value)
          : value;
      }),
    ),
  );
};

describe("Reproducible bots (#34)", () => {
  describe.each(ALL_MODES)("%s", (mode) => {
    test("4 bots (one per strategy) replay the same game with the same seed", {
      timeout: 120_000,
    }, () => {
      const players: PlayerInput[] = STRATEGIES.map((strategyName) => ({
        name: `Bot-${strategyName}`,
        bot: { strategyName },
      }));
      const first = playLoggedBotGame(mode, `repro-${mode}`, players);
      const second = playLoggedBotGame(mode, `repro-${mode}`, players);

      expect(first.game.nextAction).toEqual({ type: "step", step: "result" });
      // The engine really generated different ids for both games
      expect(second.game.lords[0]!.id).not.toBe(first.game.lords[0]!.id);
      expect(second.game.players[0]!.id).not.toBe(first.game.players[0]!.id);
      expect(normalizedEntries(second.log)).toEqual(
        normalizedEntries(first.log),
      );
    });

    // The expert and advanced bots also play the 4-bot game above; 2-bot
    // games of their own would only slow the suite down.
    test.each([
      "random",
      "greedy",
    ] as const)("2 %s bots replay the same game with the same seed", {
      timeout: 120_000,
    }, (strategyName) => {
      const players: PlayerInput[] = [
        { id: "alice", name: "Alice", bot: { strategyName } },
        { id: "bob", name: "Bob", bot: { strategyName } },
      ];
      const seed = `repro-${mode}-${strategyName}`;
      const first = playLoggedBotGame(mode, seed, players);
      const second = playLoggedBotGame(mode, seed, players);

      expect(first.game.nextAction).toEqual({ type: "step", step: "result" });
      expect(normalizedEntries(second.log)).toEqual(
        normalizedEntries(first.log),
      );
    });
  });
});
