/**
 * Helpers of the mode-aware bot tests: the extension modes, the former bot
 * behaviour, an engine counting the extension actions and bot-only games.
 */
import { findCrownsNotCoveredByGiants } from "@core/domain/entities/giant.js";
import {
  type GameState,
  type GameWithNextAction,
  isGameWithNextAction,
} from "@core/domain/types/game.js";
import type { GameEngine } from "@core/portUserside/engine.js";
import { type BotStrategy, playBotTurn } from "@core/useCases/bot.js";
import { createGameEngine } from "../../index.js";
import { legacyGreedyStrategy } from "./seededGameDriver.js";

export const MODES = [
  "QueenDomino",
  "KingdominoOrigins-Discovery",
  "KingdominoOrigins-Totem",
  "KingdominoOrigins-Tribe",
  "AgeOfGiants",
  "AgeOfGiants-QueenDomino",
] as const;

export type Mode = (typeof MODES)[number];

export const EXTENSION_METHODS = [
  "placeKnight",
  "constructBuilding",
  "useDragon",
  "placeFireToken",
  "recruitCaveman",
  "placeGiant",
  "sendGiant",
] as const;

export type ExtensionMethod = (typeof EXTENSION_METHODS)[number];

/**
 * The former behaviour of every built-in bot: territory score only, every
 * optional action skipped, giant on the first free crown.
 */
export const legacyStrategy: BotStrategy = {
  ...legacyGreedyStrategy,
  chooseKnightPosition: () => null,
  chooseBuilding: () => null,
  chooseDragonTarget: () => null,
  chooseFireTokenPosition: () => null,
  chooseCavemanRecruitment: () => null,
  chooseGiantToSend: () => null,
  chooseGiantPosition: ({ game, playerId }) => {
    const player = game.players.find((p) => p.id === playerId)!;
    return findCrownsNotCoveredByGiants(
      player.kingdom,
      player.giants ?? [],
    )[0]!;
  },
};

/** Extension actions played, per player name. */
export type Counts = Record<string, Partial<Record<ExtensionMethod, number>>>;

/** Deterministic uuids. */
export const counterUuid = (): (() => string) => {
  let counter = 0;
  return () => `uuid-${++counter}`;
};

/**
 * Engine that counts the extension actions played, per player name (the
 * player owning the lord of the command).
 */
export const countingEngine = (counts: Counts): GameEngine => {
  const engine = createGameEngine({ uuidMethod: counterUuid() });
  const counted = { ...engine };
  for (const method of EXTENSION_METHODS) {
    const original = engine[method] as (command: {
      game: GameWithNextAction;
      lordId: string;
    }) => GameState;
    (counted as Record<string, unknown>)[method] = (command: {
      game: GameWithNextAction;
      lordId: string;
    }) => {
      const lord = command.game.lords.find((l) => l.id === command.lordId);
      const name =
        command.game.players.find((p) => p.id === lord?.playerId)?.name ?? "?";
      const byPlayer = counts[name] ?? {};
      counts[name] = byPlayer;
      byPlayer[method] = (byPlayer[method] ?? 0) + 1;
      return original(command);
    };
  }
  return counted;
};

export const startGame = (
  engine: GameEngine,
  mode: string,
  seed: string,
  players: Parameters<GameEngine["addPlayers"]>[0]["players"],
): GameState => {
  let game: GameState = engine.createGame({ mode, seed });
  game = engine.addPlayers({ game, players });
  return engine.startGame({ game });
};

/** Final points per player name. */
export const finalPoints = (
  engine: GameEngine,
  game: GameState,
): Record<string, number> =>
  Object.fromEntries(
    engine
      .getResults({ game })
      .result.map((r) => [r.playerName, r.details.points] as const),
  );

/**
 * Plays a game where each player name is driven by the given strategy,
 * through `playBotTurn`. Returns the final points per name.
 */
export const playHeadToHead = (
  mode: string,
  seed: string,
  seats: [string, BotStrategy][],
): Record<string, number> => {
  const engine = createGameEngine({});
  let game = startGame(
    engine,
    mode,
    seed,
    seats.map(([name]) => name),
  );
  const strategies = new Map(seats);
  let steps = 0;
  while (isGameWithNextAction(game)) {
    if (++steps > 5000) throw new Error("Game did not finish");
    const lord = game.lords.find((l) => l.id === game.nextAction.nextLord);
    const name = game.players.find((p) => p.id === lord?.playerId)?.name ?? "";
    game = playBotTurn(engine, game, strategies.get(name)!);
  }
  return finalPoints(engine, game);
};
