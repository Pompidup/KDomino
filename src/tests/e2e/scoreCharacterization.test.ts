/**
 * Characterization test for end-of-game scoring.
 *
 * Plays complete, fully deterministic games (seeded shuffles, deterministic
 * ids, deterministic bot decisions) in every mode and freezes the final
 * results returned by `getResults` in a snapshot. The driver also performs the
 * optional extension actions (buildings, knights, fire tokens, cavemen,
 * giants) so that every end-game bonus is exercised.
 *
 * The snapshot was recorded BEFORE the score breakdown refactor (issue #13):
 * final scores, positions and tie-breaks must never change.
 */
import type { GameState, GameWithNextAction } from "@core/domain/types/game.js";
import { isGameWithNextAction } from "@core/domain/types/game.js";
import type { Position } from "@core/domain/types/kingdom.js";
import type { GameEngine } from "@core/portUserside/engine.js";
import {
  type BotStrategy,
  greedyStrategy,
  playBotTurn,
} from "@core/useCases/bot.js";
import { describe, expect, test } from "vitest";
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
    default:
      return playBotTurn(engine, game, strategy);
  }
};

// ─── Scenarios ──────────────────────────────────────────────────────

type Scenario = {
  mode: string;
  players: number;
  extraRules?: string[];
};

const scenarios: Scenario[] = [
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

const SEEDS = ["alpha", "bravo", "charlie"];
const PLAYER_NAMES = ["Alice", "Bob", "Carol", "Dave", "Erin"];

const scenarioName = (s: Scenario) =>
  `${s.mode} ${s.players}p${s.extraRules?.length ? ` [${s.extraRules.join(", ")}]` : ""}`;

const playSeededGame = (scenario: Scenario, seed: string) => {
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
    const strategy = player?.name === "Alice" ? greedyStrategy : random;
    game = playStep(engine, game, strategy);
  }

  return { engine, game };
};

describe("Score characterization (final results must never change)", () => {
  for (const scenario of scenarios) {
    for (const seed of SEEDS) {
      test(`${scenarioName(scenario)} / seed ${seed}`, () => {
        const { engine, game } = playSeededGame(scenario, seed);
        const results = engine.getResults({ game });

        const extensions = game.players.map((p) => ({
          name: p.name,
          buildings: p.buildings?.length ?? 0,
          towers: p.towers ?? 0,
          knights: p.knights?.length ?? 0,
          fireTokens: p.fireTokens?.length ?? 0,
          resources: p.resources?.length ?? 0,
          cavemen: p.cavemen?.length ?? 0,
          giants: p.giants?.length ?? 0,
        }));

        expect({
          results: results.result.map((r) => ({
            name: r.playerName,
            position: r.position,
            points: r.details.points,
            maxPropertiesSize: r.details.maxPropertiesSize,
            totalCrowns: r.details.totalCrowns,
          })),
          queenHolder:
            game.players.find((p) => p.id === game.queendomino?.queenHolderId)
              ?.name ?? null,
          extensions,
        }).toMatchSnapshot();
      });
    }
  }
});
