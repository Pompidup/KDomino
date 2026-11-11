# Kingdomino Engine

[![Node.js CI](https://github.com/Pompidup/KDomino/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/Pompidup/KDomino/actions/workflows/node.js.yml)
![Branches](./badges/coverage-branches.svg)
![Functions](./badges/coverage-functions.svg)
![Lines](./badges/coverage-lines.svg)
![Statements](./badges/coverage-statements.svg)
![Coverage total](./badges/coverage-total.svg)

A TypeScript engine for the Kingdomino board game and its expansions.

## Overview

This engine provides the core logic for Kingdomino: state management, rule enforcement, scoring, and turn flow. It is **not** a UI — consumers drive the game by calling engine methods and passing game state back in.

The engine is **stateless**: each method takes the current game state as input and returns a new game state. It is your responsibility to persist the state between calls.

## Requirements

- Node.js >= 20

## Installation

```bash
npm install @pompidup/kingdomino-engine
```

## Quick Start

```typescript
import { createGameEngine, isGameWithNextAction } from "@pompidup/kingdomino-engine";

const engine = createGameEngine({});

// Create and set up a game
let game = engine.createGame({ mode: "Classic" });
game = engine.addPlayers({ game, players: ["Alice", "Bob"] });
game = engine.startGame({ game });

// Game loop
while (isGameWithNextAction(game)) {
  const { nextLord, nextAction } = game.nextAction;

  if (nextAction === "pickDomino") {
    const [dominoPick] = engine.getValidDominoPicks({ game });
    game = engine.chooseDomino({ game, lordId: nextLord, dominoPick });
  } else if (nextAction === "placeDomino") {
    const lord = game.lords.find((l) => l.id === nextLord);
    const player = game.players.find((p) => p.id === lord?.playerId);
    if (lord?.dominoPicked && player) {
      // maxKingdomSize: 5, or 7 for a 7x7 kingdom (The Mighty Duel, Neolithic,
      // QueenDomino and AgeOfGiants-QueenDomino at 2 players)
      const placements = engine.getValidPlacements({
        kingdom: player.kingdom,
        domino: lord.dominoPicked,
        maxKingdomSize: game.rules.basic.maxKingdomSize,
      });
      if (placements.length > 0) {
        game = engine.placeDomino({ game, lordId: nextLord, position: placements[0].position, rotation: placements[0].rotation });
      } else {
        game = engine.discardDomino({ game, lordId: nextLord });
      }
    }
  } else {
    game = engine.discardDomino({ game, lordId: nextLord });
  }
}

const results = engine.getResults({ game });
console.log(results.result);
```

## Game Modes

| Mode | Description |
|------|-------------|
| **Classic** | Original Kingdomino rules. 1-4 players, 5x5 kingdom, terrain-based scoring. |
| **QueenDomino** | Full Queendomino expansion with buildings, coins, knights, the Queen and the Dragon. 2-4 players (7x7 kingdom with the 48 dominoes at 2 players). |
| **KingdominoOrigins-Discovery** | Origins expansion — volcanoes, fire tokens, fire-based scoring. |
| **KingdominoOrigins-Totem** | Origins — Discovery + wooden resources + totem majority tiles. |
| **KingdominoOrigins-Tribe** | Origins — Discovery + resources + cave board + cavemen recruitment. |
| **AgeOfGiants** | Age of Giants extension — giants, quest tiles, 5-player support, 12 new dominos on Classic. |
| **AgeOfGiants-QueenDomino** | Age of Giants combined with QueenDomino (7x7 kingdom with the 60 dominoes at 2 players). |

```typescript
let game = engine.createGame({ mode: "Classic" });
let game = engine.createGame({ mode: "QueenDomino" });
let game = engine.createGame({ mode: "KingdominoOrigins-Discovery" });
let game = engine.createGame({ mode: "AgeOfGiants" });
```

See [Game Modes](docs/game-modes.md) for rules, player counts, and extra rules details.

## Queendomino

The QueenDomino mode adds significant new mechanics to the base game:

- **Construction squares** on some domino tiles where buildings can be placed
- **Coins** (7 starting) used to purchase buildings or bribe the Dragon; 1 point per 3 unused coins at the end of the game
- **Knights** (1 at the start, more from building bonuses) placed on the domino just placed, up to 2 per turn, collecting 1 coin per square of the territory
- **Buildings** purchased from the 6-spot Builders Board (spots costing 5 to 0 coins), granting crowns, towers, and end-game bonuses
- **The Queen** hosted by the player who reaches the most towers (even on a tie): -1 coin on her host's constructions, +1 crown on their largest territory at the end
- **The Dragon** burns a building tile from the Builders Board for 1 coin
- **2 players**: 7x7 kingdoms with all 48 dominoes (official rule)

The turn flow is extended with optional actions after placing a domino:

```
placeDomino → placeKnight → constructBuilding → useDragon → pickDomino
               (optional)      (optional)         (optional)
```

```typescript
// Handle QueenDomino optional actions in your game loop
if (nextAction === "placeKnight" || nextAction === "constructBuilding" || nextAction === "useDragon") {
  game = engine.skipOptionalAction({ game, lordId: nextLord });
}
```

See [Queendomino Guide](docs/queendomino.md) for the complete rules, building list, and game loop example.

## Kingdomino Origins

Origins introduces prehistoric terrains and fire-based scoring across three modes:

- **Discovery**: Volcanoes provide fire tokens. Scoring = region size × fire symbols.
- **Totem**: Discovery + wooden resources + totem majority tiles for bonus points.
- **Tribe**: Discovery + resources + cave board with 22 cavemen to recruit.

```typescript
if (nextAction === "placeFireToken") {
  game = engine.placeFireToken({ game, lordId: nextLord, position });
}
if (nextAction === "recruitCaveman") {
  game = engine.recruitCaveman({ game, lordId: nextLord, cavemanId, position, resourcePositions });
}
```

See [Origins Guide](docs/origins.md) for the complete rules and mechanics.

## Age of Giants

Age of Giants extends Classic (or QueenDomino) with giants, quest tiles, and 5-player support:

- **60 dominos** (48 original + 12 new with giant/footprint symbols)
- **Giants** cover crowns on your kingdom, reducing opponents' scores
- **Quest tiles** (2 per game) provide end-game bonus scoring conditions
- **5-player support** with 5 dominos revealed per turn

```typescript
if (nextAction === "placeGiant") {
  game = engine.placeGiant({ game, lordId: nextLord, position });
}
if (nextAction === "sendGiant") {
  // The targeted opponent chooses the crown the giant covers
  game = engine.sendGiant({ game, lordId: nextLord, giantIndex, targetPlayerId });
}
```

After `sendGiant`, a single free crown of the opponent is covered automatically. With several free crowns, `game.ageOfGiants.pendingGiant` is set and the game waits for a `placeGiant` played by a lord of the **targeted** player (`getValidGiantPositions` lists its crowns). `targetCrownPosition` is still accepted for backward compatibility.

See [Age of Giants Guide](docs/age-of-giants.md) for the complete rules and mechanics.

## Extra Rules

| Rule | Description | Restriction |
|------|-------------|-------------|
| **The Middle Kingdom** | +10 points if castle is centered | — |
| **Harmony** | +5 points if no dominos were discarded | — |
| **The Mighty Duel** | All 48 dominos, 7x7 kingdom | 2 players only (QueenDomino already plays 7x7 at 2 players: accepted, without further effect) |
| **Dynasty** | Play 3 games, highest total wins | — |

Origins has its own equivalents: **Empire of Fire**, **Homo Habilis**, **Neolithic** (2 players, 7x7, and the first pick of each line takes the dominoes 1 & 4 or 2 & 3 — see [Origins Guide](docs/origins.md#neolithic-2-players)) and **Dynasty**.

```typescript
game = engine.addExtraRules({ game, extraRules: ["The middle Kingdom", "Harmony"] });

// Dynasty: aggregate results from multiple games (grouped by player id: pass
// the same stable ids to addPlayers in every game, e.g. { id: "alice", name: "Alice" })
const dynastyResults = engine.getDynastyResults({ games: [game1, game2, game3] });
```

See [Game Modes](docs/game-modes.md#extra-rules) for details.

## Engine Options

```typescript
const engine = createGameEngine({
  logging: true,                          // Console logging
  logger: { info: console.log, error: console.error },  // Custom logger
  shuffleMethod: (arr) => arr,            // Custom shuffle (e.g. no-op for testing)
  uuidMethod: () => "custom-uuid",        // Custom UUID generator
  events: { onGameEnd: () => {} },        // Event callbacks
  debug: true,                            // Debug mode
});
```

## API Overview

### Core Methods

| Method | Description |
|--------|-------------|
| `getModes` | Get available game modes |
| `createGame` | Create a new game |
| `addPlayers` | Add 1-4 players |
| `addExtraRules` | Add optional extra rules |
| `startGame` | Start the game |
| `chooseDomino` | Pick a domino from the revealed set |
| `placeDomino` | Place a domino on the kingdom |
| `discardDomino` | Discard when no valid placement exists |
| `getResults` | Get final rankings and scores |
| `calculateScore` | Calculate score for any kingdom |
| `getValidPlacements` | Find all valid placements for a domino |
| `canPlaceDomino` | Check if any placement exists |
| `getValidDominoPicks` | Dominoes the lord to play may pick (Neolithic reservations included) |
| `calculatePlayerScore` | Mode-aware live (or final) score of one player, with its breakdown |
| `serialize` / `deserialize` | Save and restore game state |
| `getDynastyResults` | Aggregate scores from multiple games |

### Queendomino Methods

| Method | Description |
|--------|-------------|
| `placeKnight` | Place a knight and collect tax |
| `constructBuilding` | Buy and place a building |
| `useDragon` | Destroy a building tile from the board (1 coin) |
| `skipOptionalAction` | Skip the current optional action |
| `getMaxKnights` | Knight limit of a player (1 starting knight + building bonus knights) |

### Origins Methods

| Method | Description |
|--------|-------------|
| `placeFireToken` | Place a fire token after placing a volcano domino |
| `recruitCaveman` | Recruit a caveman from the cave board (Tribe mode) |

### Age of Giants Methods

| Method | Description |
|--------|-------------|
| `placeGiant` | Place a giant on a crown in your kingdom |
| `sendGiant` | Send a giant to an opponent's kingdom |

### Valid targets

`getValidFireTokenPositions`, `getValidKnightPositions`, `getValidBuildingPositions`, `getAffordableBuildings`, `getValidDragonTargets`, `getValidCavemanPlacements`, `getValidGiantPositions`, `getValidGiantTargets` and `canSkipOptionalAction` list what the extension actions accept, with the same checks as the actions (see [Valid targets](docs/api-reference.md#valid-targets-for-extension-actions)).

See [API Reference](docs/api-reference.md) for complete method signatures, types, and error codes.

## Additional Features

- **Bot / AI**: 4 built-in strategies (`randomStrategy`, `greedyStrategy`, `advancedStrategy`, `expertStrategy`) with `playBotTurn()` helper; mode-aware (they evaluate with the mode-aware score and play the Queendomino, Origins and Age of Giants actions — see [Bot Strategies](docs/api-reference.md#bot-strategies))
- **Mixed games**: Human and bot players in the same game via `bot: { strategyName }` on player input
- **Undo / Redo**: Snapshot-based history with `createGameHistory()`, `pushState()`, `undo()`, `redo()`
- **Action Log**: Immutable log via `wrapWithActionLog(engine)` for replay with `replayActions()`; format v2 records the seed and the game, player and lord ids, so a replay gives a strictly identical state (v1 logs remain replayable)
- **Events**: Callbacks via `EngineConfig.events` (`onDominoPlaced`, `onGameEnd`, etc.)
- **Debug Mode**: `wrapWithDebug(engine)` with 3 verbosity levels
- **Seeded games**: Deterministic shuffle via `createGame({ mode, seed: "my-seed" })`
- **Serialization**: `serializeGame()` / `deserializeGame()` and save points
- **WASM Build**: `pnpm build:wasm` produces a WebAssembly module usable from any language

## Documentation

| Document | Content |
|----------|---------|
| [Game Modes](docs/game-modes.md) | Modes, rules by player count, extra rules, game flow |
| [Queendomino Guide](docs/queendomino.md) | Complete Queendomino rules, mechanics, and examples |
| [Origins Guide](docs/origins.md) | Kingdomino Origins rules, fire tokens, resources, cavemen |
| [Age of Giants Guide](docs/age-of-giants.md) | Age of Giants rules, giants, quest tiles, 5-player support |
| [API Reference](docs/api-reference.md) | All methods, types, error codes, and utilities |
| [WASM Build](wasm/README.md) | Cross-language usage via WebAssembly |

## Development

```bash
pnpm install          # Install dependencies
pnpm test             # Run tests (watch mode)
pnpm test -- --run    # Run tests once
pnpm coverage         # Tests with coverage
pnpm typecheck        # Type check (tsc)
pnpm lint             # Lint (biome)
pnpm build            # Build (ESM to dist/)
pnpm build:wasm       # Build WASM module (requires javy)
```

## Contributing

1. Fork the repository
2. Create a branch (`git checkout -b feature/your-feature`)
3. Make changes with tests (`pnpm test -- --run && pnpm typecheck`)
4. Open a Pull Request
