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
    const domino = game.currentDominoes.find((d) => !d.picked);
    if (domino) {
      game = engine.chooseDomino({ game, lordId: nextLord, dominoPick: domino.domino.number });
    }
  } else if (nextAction === "placeDomino") {
    const lord = game.lords.find((l) => l.id === nextLord);
    const player = game.players.find((p) => p.id === lord?.playerId);
    if (lord?.dominoPicked && player) {
      const placements = engine.getValidPlacements({ kingdom: player.kingdom, domino: lord.dominoPicked });
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
| **QueenDomino** | Full Queendomino expansion with buildings, coins, knights, the Queen and the Dragon. Extended turn flow with optional actions. |

```typescript
// Classic
let game = engine.createGame({ mode: "Classic" });

// Queendomino
let game = engine.createGame({ mode: "QueenDomino" });
```

See [Game Modes](docs/game-modes.md) for rules, player counts, and extra rules details.

## Queendomino

The QueenDomino mode adds significant new mechanics to the base game:

- **Construction squares** on some domino tiles where buildings can be placed
- **Coins** (7 starting) used to purchase buildings or use the Dragon
- **Knights** (max 3) placed on dominos to collect tax from construction squares
- **Buildings** (18 types) purchased from the Builders Board, granting crowns, towers, and end-game bonuses
- **The Queen** goes to the player with the most towers, granting +1 crown to the best territory
- **The Dragon** burns a building tile from the Builders Board

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

## Extra Rules

| Rule | Description | Restriction |
|------|-------------|-------------|
| **The Middle Kingdom** | +10 points if castle is centered | — |
| **Harmony** | +5 points if no dominos were discarded | — |
| **The Mighty Duel** | All 48 dominos, 7x7 kingdom | 2 players only |
| **Dynasty** | Play 3 games, highest total wins | — |

```typescript
game = engine.addExtraRules({ game, extraRules: ["The middle Kingdom", "Harmony"] });

// Dynasty: aggregate results from multiple games
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
| `serialize` / `deserialize` | Save and restore game state |
| `getDynastyResults` | Aggregate scores from multiple games |

### Queendomino Methods

| Method | Description |
|--------|-------------|
| `placeKnight` | Place a knight and collect tax |
| `constructBuilding` | Buy and place a building |
| `useDragon` | Destroy a building tile from the board |
| `skipOptionalAction` | Skip the current optional action |

See [API Reference](docs/api-reference.md) for complete method signatures, types, and error codes.

## Additional Features

- **Bot / AI**: 4 built-in strategies (`randomStrategy`, `greedyStrategy`, `advancedStrategy`, `expertStrategy`) with `playBotTurn()` helper
- **Mixed games**: Human and bot players in the same game via `bot: { strategyName }` on player input
- **Undo / Redo**: Snapshot-based history with `createGameHistory()`, `pushState()`, `undo()`, `redo()`
- **Action Log**: Immutable log via `wrapWithActionLog(engine)` for replay with `replayActions()`
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
