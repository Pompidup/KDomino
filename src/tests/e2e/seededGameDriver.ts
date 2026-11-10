/**
 * Deterministic game driver for end-to-end scoring tests: plays complete
 * games with seeded shuffles, deterministic ids and deterministic bot
 * decisions, performing the optional extension actions (buildings, knights,
 * fire tokens, cavemen, giants) whenever a valid one exists.
 */
import { findCrownsNotCoveredByGiants } from "@core/domain/entities/giant.js";
import { placeDomino } from "@core/domain/entities/kingdom.js";
import type { Domino } from "@core/domain/types/domino.js";
import type { GameState, GameWithNextAction } from "@core/domain/types/game.js";
import { isGameWithNextAction } from "@core/domain/types/game.js";
import type { Kingdom, Position } from "@core/domain/types/kingdom.js";
import type { GameEngine } from "@core/portUserside/engine.js";
import { type BotStrategy, playBotTurn } from "@core/useCases/bot.js";
import { calculateScoreUseCase } from "@core/useCases/calculateScore.js";
import type { ValidPlacement } from "@core/useCases/getValidPlacements.js";
import { getValidPlacementsUseCase } from "@core/useCases/getValidPlacements.js";
import { isOk } from "@utils/result.js";
import { createGameEngine } from "../../index.js";

// ─── Deterministic helpers ──────────────────────────────────────────

const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const hashString = (value: string): number => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/** Seeded "random" strategy: varied but reproducible decisions. */
const seededStrategy = (rand: () => number): BotStrategy => ({
  chooseDomino: ({ availableDominoes }) =>
    availableDominoes[Math.floor(rand() * availableDominoes.length)]!.domino
      .number,
  choosePlacement: ({ validPlacements }) => {
    // Random placements regularly lead to forced discards later on, which
    // exercises Harmony / Homo Habilis both ways.
    if (validPlacements.length === 0) return null;
    return validPlacements[Math.floor(rand() * validPlacements.length)]!;
  },
});

/*
 * Frozen copy of the original greedy bot (territory score only) and of the
 * original giant placement (first free crown). The built-in bots evolve (they
 * became mode-aware); the score characterization must only depend on the
 * scoring rules, so this driver keeps playing exactly the same games.
 */

const territoryScore = (kingdom: Kingdom): number => {
  const result = calculateScoreUseCase(kingdom);
  return isOk(result) ? result.value.points : 0;
};

const bestTerritoryPlacement = (
  kingdom: Kingdom,
  domino: Domino,
  placements: ValidPlacement[],
  maxSize: number,
): { placement: ValidPlacement; score: number } | null => {
  let best: { placement: ValidPlacement; score: number } | null = null;
  for (const placement of placements) {
    const next = placeDomino(
      kingdom,
      placement.position,
      placement.rotation,
      domino,
      maxSize,
    );
    if (!isOk(next)) continue;
    const score = territoryScore(next.value);
    if (!best || score > best.score) best = { placement, score };
  }
  return best;
};

export const legacyGreedyStrategy: BotStrategy = {
  chooseDomino: ({ game, lordId, availableDominoes }) => {
    const lord = game.lords.find((l) => l.id === lordId);
    const player = game.players.find((p) => p.id === lord?.playerId);
    if (!player) return availableDominoes[0]!.domino.number;
    const maxSize = game.rules.basic.maxKingdomSize;
    let bestScore = -1;
    let bestPick = availableDominoes[0]!.domino.number;
    for (const rd of availableDominoes) {
      const placements = getValidPlacementsUseCase(
        player.kingdom,
        rd.domino,
        maxSize,
      );
      const result = bestTerritoryPlacement(
        player.kingdom,
        rd.domino,
        placements,
        maxSize,
      );
      const score = result ? result.score : 0;
      if (score > bestScore) {
        bestScore = score;
        bestPick = rd.domino.number;
      }
    }
    return bestPick;
  },
  choosePlacement: ({ game, domino, kingdom, validPlacements }) => {
    if (validPlacements.length === 0) return null;
    const result = bestTerritoryPlacement(
      kingdom,
      domino,
      validPlacements,
      game.rules.basic.maxKingdomSize,
    );
    return result ? result.placement : validPlacements[0]!;
  },
};

/** Original giant placement: first crown not covered yet. */
const placeGiantOnFirstCrown = (
  engine: GameEngine,
  game: GameWithNextAction,
): GameState => {
  const lordId = game.nextAction.nextLord;
  const player = currentPlayer(game);
  const crown = player
    ? findCrownsNotCoveredByGiants(player.kingdom, player.giants ?? [])[0]
    : undefined;
  return crown
    ? engine.placeGiant({ game, lordId, position: crown })
    : engine.skipOptionalAction({ game, lordId });
};

const allPositions = (): Position[] => {
  const positions: Position[] = [];
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      positions.push({ x, y });
    }
  }
  return positions;
};

/** Returns the first engine call that does not throw. */
const firstSuccess = (
  attempts: Iterable<() => GameState>,
): GameState | undefined => {
  for (const attempt of attempts) {
    try {
      return attempt();
    } catch {
      // invalid attempt, try the next one
    }
  }
  return undefined;
};

const currentPlayer = (game: GameWithNextAction) => {
  const lord = game.lords.find((l) => l.id === game.nextAction.nextLord);
  return game.players.find((p) => p.id === lord?.playerId);
};

function* buildingAttempts(engine: GameEngine, game: GameWithNextAction) {
  const lordId = game.nextAction.nextLord;
  const player = currentPlayer(game);
  const slots = game.queendomino?.buildersBoard.slots ?? [];
  for (const building of slots) {
    if (!building || building.cost > (player?.coins ?? 0)) continue;
    for (const position of allPositions()) {
      yield () =>
        engine.constructBuilding({
          game,
          lordId,
          buildingId: building.id,
          position,
        });
    }
  }
}

function* cavemanAttempts(engine: GameEngine, game: GameWithNextAction) {
  const lordId = game.nextAction.nextLord;
  const player = currentPlayer(game);
  const resources = player?.resources ?? [];
  let pair: Position[] | undefined;
  for (let i = 0; i < resources.length && !pair; i++) {
    for (let j = i + 1; j < resources.length && !pair; j++) {
      if (resources[i]!.type !== resources[j]!.type) {
        pair = [resources[i]!.position, resources[j]!.position];
      }
    }
  }
  if (!pair) return;
  const visible = game.origins?.caveBoard?.visible ?? [];
  for (const caveman of visible) {
    for (const position of allPositions()) {
      yield () =>
        engine.recruitCaveman({
          game,
          lordId,
          cavemanId: caveman.id,
          position,
          resourcePositions: pair,
        });
    }
  }
}

function* positionAttempts(
  positions: Position[],
  call: (position: Position) => GameState,
) {
  for (const position of positions) {
    yield () => call(position);
  }
}

function* sendGiantAttempts(engine: GameEngine, game: GameWithNextAction) {
  const lordId = game.nextAction.nextLord;
  const player = currentPlayer(game);
  const giants = player?.giants ?? [];
  for (let giantIndex = 0; giantIndex < giants.length; giantIndex++) {
    for (const target of game.players) {
      if (target.id === player?.id) continue;
      yield () =>
        engine.sendGiant({
          game,
          lordId,
          giantIndex,
          targetPlayerId: target.id,
        });
    }
  }
}

/**
 * Plays one decision. Domino picks/placements use the given strategy; the
 * optional extension actions are performed whenever a valid one exists.
 */
const playStep = (
  engine: GameEngine,
  game: GameWithNextAction,
  strategy: BotStrategy,
): GameState => {
  const lordId = game.nextAction.nextLord;
  const skip = () => engine.skipOptionalAction({ game, lordId });

  switch (game.nextAction.nextAction) {
    case "constructBuilding":
      return firstSuccess(buildingAttempts(engine, game)) ?? skip();
    case "placeKnight":
      return (
        firstSuccess(
          positionAttempts(game.queendomino?.lastPlacedPositions ?? [], (p) =>
            engine.placeKnight({ game, lordId, position: p }),
          ),
        ) ?? skip()
      );
    case "placeFireToken":
      return (
        firstSuccess(
          positionAttempts(allPositions(), (p) =>
            engine.placeFireToken({ game, lordId, position: p }),
          ),
        ) ?? skip()
      );
    case "recruitCaveman":
      return firstSuccess(cavemanAttempts(engine, game)) ?? skip();
    case "sendGiant":
      return firstSuccess(sendGiantAttempts(engine, game)) ?? skip();
    case "useDragon":
      return skip();
    case "placeGiant":
      return placeGiantOnFirstCrown(engine, game);
    default:
      return playBotTurn(engine, game, strategy);
  }
};

// ─── Scenarios ──────────────────────────────────────────────────────

export type Scenario = {
  mode: string;
  players: number;
  extraRules?: string[];
};

export const scenarios: Scenario[] = [
  { mode: "Classic", players: 1 },
  { mode: "Classic", players: 2 },
  { mode: "Classic", players: 3 },
  { mode: "Classic", players: 4 },
  { mode: "Classic", players: 2, extraRules: ["The middle Kingdom"] },
  { mode: "Classic", players: 3, extraRules: ["Harmony"] },
  {
    mode: "Classic",
    players: 4,
    extraRules: ["The middle Kingdom", "Harmony"],
  },
  {
    mode: "Classic",
    players: 2,
    extraRules: ["The Mighty Duel", "The middle Kingdom", "Harmony"],
  },
  { mode: "QueenDomino", players: 2 },
  { mode: "QueenDomino", players: 3 },
  {
    mode: "QueenDomino",
    players: 4,
    extraRules: ["The middle Kingdom", "Harmony"],
  },
  { mode: "QueenDomino", players: 2, extraRules: ["The Mighty Duel"] },
  { mode: "KingdominoOrigins-Discovery", players: 2 },
  {
    mode: "KingdominoOrigins-Discovery",
    players: 3,
    extraRules: ["Empire of Fire", "Homo Habilis"],
  },
  { mode: "KingdominoOrigins-Discovery", players: 4 },
  { mode: "KingdominoOrigins-Totem", players: 2 },
  {
    mode: "KingdominoOrigins-Totem",
    players: 3,
    extraRules: ["Empire of Fire"],
  },
  { mode: "KingdominoOrigins-Totem", players: 4, extraRules: ["Homo Habilis"] },
  {
    mode: "KingdominoOrigins-Totem",
    players: 2,
    extraRules: ["Neolithic", "Homo Habilis"],
  },
  { mode: "KingdominoOrigins-Tribe", players: 2 },
  { mode: "KingdominoOrigins-Tribe", players: 3 },
  {
    mode: "KingdominoOrigins-Tribe",
    players: 4,
    extraRules: ["Empire of Fire", "Homo Habilis"],
  },
  { mode: "AgeOfGiants", players: 2 },
  { mode: "AgeOfGiants", players: 3 },
  { mode: "AgeOfGiants", players: 4 },
  { mode: "AgeOfGiants", players: 5 },
  { mode: "AgeOfGiants-QueenDomino", players: 2 },
  { mode: "AgeOfGiants-QueenDomino", players: 3 },
  { mode: "AgeOfGiants-QueenDomino", players: 4 },
];

export const SEEDS = ["alpha", "bravo", "charlie"];
const PLAYER_NAMES = ["Alice", "Bob", "Carol", "Dave", "Erin"];

export const scenarioName = (s: Scenario) =>
  `${s.mode} ${s.players}p${s.extraRules?.length ? ` [${s.extraRules.join(", ")}]` : ""}`;

/**
 * Plays a complete game. `onStep` is called with every intermediate state
 * (after each engine call), e.g. to check live scores.
 */
export const playSeededGame = (
  scenario: Scenario,
  seed: string,
  onStep?: (engine: GameEngine, game: GameState) => void,
) => {
  let counter = 0;
  const engine = createGameEngine({
    uuidMethod: () => `id-${++counter}`,
  });
  const rand = mulberry32(hashString(`${scenarioName(scenario)}|${seed}`));
  const random = seededStrategy(rand);

  let game: GameState = engine.createGame({ mode: scenario.mode, seed });
  game = engine.addPlayers({
    game,
    players: PLAYER_NAMES.slice(0, scenario.players),
  });
  if (scenario.extraRules?.length) {
    game = engine.addExtraRules({ game, extraRules: scenario.extraRules });
  }
  game = engine.startGame({ game });

  let steps = 0;
  while (isGameWithNextAction(game)) {
    if (++steps > 5000) throw new Error("Game did not finish");
    const player = currentPlayer(game);
    // First player plays greedy, the others play seeded random
    const strategy = player?.name === "Alice" ? legacyGreedyStrategy : random;
    game = playStep(engine, game, strategy);
    onStep?.(engine, game);
  }

  return { engine, game };
};
