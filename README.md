# Kingdomino Engine

[![Node.js CI](https://github.com/Pompidup/KDomino/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/Pompidup/KDomino/actions/workflows/node.js.yml)
![Branches](./badges/coverage-branches.svg)
![Functions](./badges/coverage-functions.svg)
![Lines](./badges/coverage-lines.svg)
![Statements](./badges/coverage-statements.svg)
![Coverage total](./badges/coverage-total.svg)

A simple, lightweight TypeScript engine for the Kingdomino board game.

## Table of Contents

- [Overview](#overview)
- [Requirements](#requirements)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Basic Setup](#basic-setup)
  - [Engine Options](#engine-options)
  - [Adding Players](#adding-players)
  - [Getting Available Game Modes](#getting-available-game-modes)
  - [Getting Available Extra Rules](#getting-available-extra-rules)
  - [Setting Up Extra Rules](#setting-up-extra-rules)
  - [Starting the Game](#starting-the-game)
  - [Player Actions](#player-actions)
  - [Game Flow](#game-flow)
  - [Scoring](#scoring)
  - [Valid Placements](#valid-placements)
  - [Serialization](#serialization)
- [Complete Game Example](#complete-game-example)
- [Extra Rules](#extra-rules)
- [API Documentation](#api-documentation)
  - [Key Types and Interfaces](#key-types-and-interfaces)
  - [Methods](#methods)
- [Development](#development)
  - [Setup](#setup)
  - [Testing](#testing)
  - [Linting and Type Checking](#linting-and-type-checking)
  - [Building](#building)
- [Contributing](#contributing)

## Overview

This is a simple and lightweight TypeScript engine designed to facilitate the gameplay of Kingdomino. It provides the core logic for managing game states, rules, and player interactions, making it easy to integrate into any application that requires a Kingdomino game engine.

Kingdomino is a tile-placement game where players build kingdoms by connecting domino-like tiles with different terrains. This engine handles all the game logic, allowing you to focus on building the user interface and experience.

The engine is **stateless**: each method takes the current game state as input and returns a new game state. It is your responsibility to persist the state between calls.

## Requirements

- Node.js >= 18

## Features

- **Game State Management**: Efficiently manage game states, including player turns, game rules, and game progression.
- **Rule Enforcement**: Automatically enforce game rules, ensuring a fair and consistent gameplay experience.
- **Player Interaction**: Simplify player interactions, including drawing tiles, placing dominoes, and scoring.
- **Extra Rules Support**: Implement and manage additional game rules for enhanced gameplay.
- **Multiple Game Modes**: Support for different game modes, including Classic and potentially others.
- **Scoring System**: Automatic calculation of scores based on kingdom layouts and rule sets.
- **Valid Placement Detection**: Find all valid positions for a domino or check if any placement exists.
- **Serialization**: Save and restore game state to/from JSON for persistence.
- **TypeScript Support**: Full TypeScript support with comprehensive type definitions.
- **Dependency Injection**: Custom shuffle, UUID, and logger implementations can be injected.

## Installation

To install the Kingdomino Engine, you can use npm, yarn or pnpm. Run one of the following commands in your terminal:

```bash
npm install @pompidup/kingdomino-engine
yarn add @pompidup/kingdomino-engine
pnpm add @pompidup/kingdomino-engine
```

## Usage

The Kingdomino Engine is designed to be easy to use and integrate into any application. Below are examples of how you can use the engine to create a new game, add players, set rules, and manage gameplay.

Each method returns an updated game state object, which contains the current state of the game, including the board, players, and dominoes. You will also receive the nextLord (the next player to play) and the nextAction (the next action to be performed by the next player).

**It's your responsibility to save and pass the updated game state to the next method call.**

### Basic Setup

To start using the Kingdomino Engine, import it and initialize a new game instance:

```typescript
import { createGameEngine } from "@pompidup/kingdomino-engine";

const engine = createGameEngine({});
let gameState = engine.createGame({ mode: "Classic" });
```

### Engine Options

You can pass options to the `createGameEngine` function to customize the engine's behavior:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `logging` | `boolean` | `false` | Enable console logging for debugging |
| `logger` | `Logger` | — | Custom logger instance (takes precedence over `logging`) |
| `shuffleMethod` | `ShuffleMethod` | Fisher-Yates | Custom shuffle function for dominoes and lords |
| `uuidMethod` | `UuidMethod` | `crypto.randomUUID()` | Custom UUID generator |

```typescript
import { createGameEngine, type EngineConfig } from "@pompidup/kingdomino-engine";

// With logging enabled
const engine = createGameEngine({ logging: true });

// With custom logger
const engine = createGameEngine({
  logger: {
    info: (msg) => console.log(msg),
    error: (msg) => console.error(msg),
  },
});

// With deterministic shuffle (useful for testing)
const engine = createGameEngine({
  shuffleMethod: (array) => array, // No shuffle
});
```

### Adding Players

Add players to the game by passing an array of player names (2-4 players, minimum 3 characters per name):

```typescript
gameState = engine.addPlayers({
  game: gameState,
  players: ["Alice", "Bob", "Carol"],
});
```

### Getting Available Game Modes

You can get available game modes and select one for the game:

```typescript
const modes = engine.getModes({});
gameState = engine.createGame({ mode: modes[0].name });
```

### Getting Available Extra Rules

You can get available extra rules for a specific game mode and number of players:

```typescript
const extraRules = engine.getExtraRules({ mode: "Classic", players: 2 });
```

### Setting Up Extra Rules

You can add extra rules to the game to modify gameplay:

```typescript
gameState = engine.addExtraRules({
  game: gameState,
  extraRules: ["The middle Kingdom"],
});
```

### Starting the Game

After setting up players and rules, start the game. The engine will automatically set up the initial game state and determine the first player (lord) to play in `nextAction`.

```typescript
gameState = engine.startGame({ game: gameState });
```

### Player Actions

Players can perform actions like picking a domino, placing a domino, and discarding a domino.

**Pick a domino** from the currently revealed set:

```typescript
gameState = engine.chooseDomino({
  game: gameState,
  lordId: "lordId",
  dominoPick: 12, // domino number
});
```

**Place a domino** on the kingdom grid:

```typescript
gameState = engine.placeDomino({
  game: gameState,
  lordId: "lordId",
  position: { x: 5, y: 4 },
  rotation: 0, // 0, 90, 180, or 270
});
```

**Discard a domino** when no valid placement exists:

```typescript
gameState = engine.discardDomino({
  game: gameState,
  lordId: "lordId",
});
```

### Game Flow

The game progresses through steps and actions. The `nextAction` property in the game state indicates what should happen next.

**Steps** (setup and completion phases): `addPlayers` → `options` → `start` → `result`

**Actions** (during gameplay): `pickDomino`, `placeDomino`, `pass`

Use the provided type guards to determine the current state:

```typescript
import { isGameWithNextAction, isGameWithNextStep } from "@pompidup/kingdomino-engine";

while (isGameWithNextAction(gameState)) {
  const { nextLord, nextAction } = gameState.nextAction;
  // Handle pickDomino, placeDomino, or pass
}

if (isGameWithNextStep(gameState)) {
  // Game has ended, get results
}
```

### Scoring

When the last turn is played, the game transitions to the `result` step. Get final results with rankings:

```typescript
const gameWithResults = engine.getResults({ game: gameState });
console.log(gameWithResults.result);
// [{ playerId, playerName, details: { points, maxPropertiesSize, totalCrowns }, position }]
```

You can also calculate the score of any kingdom at any time:

```typescript
const score = engine.calculateScore({ kingdom: gameState.players[0].kingdom });
// { points: 42, maxPropertiesSize: 5, totalCrowns: 8 }
```

### Valid Placements

The engine provides helpers to determine where a domino can be placed:

```typescript
// Get all valid positions and rotations for a domino
const placements = engine.getValidPlacements({
  kingdom: player.kingdom,
  domino: myDomino,
});
// [{ position: { x: 3, y: 4 }, rotation: 0 }, ...]

// Quick check: can this domino be placed at all?
const canPlace = engine.canPlaceDomino({
  kingdom: player.kingdom,
  domino: myDomino,
});
// true or false
```

### Serialization

Save and restore game state for persistence:

```typescript
import {
  serializeGame,
  deserializeGame,
  createSavePoint,
  restoreFromSavePoint,
} from "@pompidup/kingdomino-engine";

// Serialize to JSON string
const json = serializeGame(gameState);

// Deserialize back (returns a Result type)
const result = deserializeGame(json);

// Or use save points with metadata
const savePoint = createSavePoint(gameState);
// { serialized, createdAt, gameId, turn }

const restored = restoreFromSavePoint(savePoint);
```

The engine also provides `serialize` and `deserialize` methods on the engine instance:

```typescript
const json = engine.serialize({ game: gameState });
const restored = engine.deserialize({ json });
```

## Complete Game Example

Here's a complete example of how to simulate a game from start to finish:

```typescript
import { createGameEngine, isGameWithNextAction } from "@pompidup/kingdomino-engine";

// Create the game engine
const engine = createGameEngine({});

// Create a new game with Classic mode
let game = engine.createGame({ mode: "Classic" });

// Add players
game = engine.addPlayers({ game, players: ["Alice", "Bob"] });

// Optionally add extra rules
game = engine.addExtraRules({ game, extraRules: ["The middle Kingdom", "Harmony"] });

// Start the game
game = engine.startGame({ game });

// Game loop
while (isGameWithNextAction(game)) {
  const currentLordId = game.nextAction.nextLord;
  const nextAction = game.nextAction.nextAction;

  if (nextAction === "pickDomino") {
    // Pick the first available domino
    const availableDomino = game.currentDominoes.find((d) => !d.picked);
    if (availableDomino) {
      game = engine.chooseDomino({
        game,
        lordId: currentLordId,
        dominoPick: availableDomino.domino.number,
      });
    }
  } else if (nextAction === "placeDomino") {
    // Check if placement is possible
    const lord = game.lords.find((l) => l.id === currentLordId);
    const player = game.players.find((p) => p.id === lord?.playerId);

    if (lord?.dominoPicked && player) {
      const canPlace = engine.canPlaceDomino({
        kingdom: player.kingdom,
        domino: lord.dominoPicked,
      });

      if (canPlace) {
        const placements = engine.getValidPlacements({
          kingdom: player.kingdom,
          domino: lord.dominoPicked,
        });
        game = engine.placeDomino({
          game,
          lordId: currentLordId,
          position: placements[0].position,
          rotation: placements[0].rotation,
        });
      } else {
        game = engine.discardDomino({ game, lordId: currentLordId });
      }
    }
  } else {
    // pass action
    game = engine.discardDomino({ game, lordId: currentLordId });
  }
}

// Get the final results
const gameResult = engine.getResults({ game });
console.log("Game results:", gameResult.result);
```

## Extra Rules

The engine supports extra rules that can modify gameplay:

- **The Middle Kingdom**: Gain 10 additional points if your castle is in the middle of the kingdom.
- **Harmony**: Gain 5 additional points if your kingdom is complete (no discarded dominoes).

You can get all available extra rules for a specific game mode and number of players:

```typescript
const extraRules = engine.getExtraRules({ mode: "Classic", players: 2 });
```

## API Documentation

### Key Types and Interfaces

#### GameEngine

The main interface for interacting with the Kingdomino engine.

```typescript
type GameEngine = {
  getModes: (command: GetModesCommand) => GameMode[];
  getExtraRules: (command: GetExtraRulesCommand) => ExtraRule[];
  createGame: (command: CreateGameCommand) => GameWithNextStep;
  addPlayers: (command: AddPlayersCommand) => GameWithNextStep;
  addExtraRules: (command: AddExtraRulesCommand) => GameWithNextStep;
  startGame: (command: StartGameCommand) => GameWithNextAction;
  chooseDomino: (command: ChooseDominoCommand) => GameWithNextAction;
  placeDomino: (command: PlaceDominoCommand) => GameState;
  discardDomino: (command: DiscardDominoCommand) => GameState;
  getResults: (command: GetResultCommand) => GameWithResults;
  calculateScore: (command: CalculateScoreCommand) => Score;
  getValidPlacements: (command: GetValidPlacementsCommand) => ValidPlacement[];
  canPlaceDomino: (command: CanPlaceDominoCommand) => boolean;
  serialize: (command: SerializeGameCommand) => string;
  deserialize: (command: DeserializeGameCommand) => GameState;
};
```

#### Game

Represents the current state of a Kingdomino game.

```typescript
type Game = {
  id: string;
  dominoes: Domino[];
  currentDominoes: RevealsDomino[];
  players: Player[];
  lords: Lord[];
  turn: number;
  nextAction: NextAction | NextStep;
  rules: SelectedRules;
  mode: GameMode;
};
```

#### NextStep and NextAction

Represent the next step or action in the game flow.

```typescript
type NextStep = {
  type: "step";
  step: "addPlayers" | "options" | "start" | "result";
};

type NextAction = {
  type: "action";
  nextLord: string;
  nextAction: "pickDomino" | "placeDomino" | "pass";
};
```

#### Score

Represents the score calculation for a kingdom.

```typescript
type Score = {
  points: number;
  maxPropertiesSize: number;
  totalCrowns: number;
};
```

#### ExtraRule

Represents an additional rule that can be applied to the game.

```typescript
type ExtraRule = {
  name: string;
  description: string;
  mode: GameMode[];
  playersLimit?: number;
};
```

#### ValidPlacement

Represents a valid position and rotation for placing a domino.

```typescript
type ValidPlacement = {
  position: Position;
  rotation: Rotation; // 0 | 90 | 180 | 270
};
```

#### Domain Errors

The engine throws typed `DomainException` errors with error codes for programmatic handling:

```typescript
import { DomainException, ErrorCode } from "@pompidup/kingdomino-engine";

try {
  game = engine.placeDomino({ game, lordId, position, rotation });
} catch (error) {
  if (error instanceof DomainException) {
    console.log(error.code);    // e.g. "INVALID_PLACEMENT"
    console.log(error.message);  // Human-readable message
    console.log(error.context);  // Optional debug context
  }
}
```

### Methods

| Method | Input | Output | Description |
|--------|-------|--------|-------------|
| `getModes` | `{}` | `GameMode[]` | Get available game modes |
| `getExtraRules` | `{ mode, players }` | `ExtraRule[]` | Get extra rules for a mode/player count |
| `createGame` | `{ mode }` | `GameWithNextStep` | Create a new game |
| `addPlayers` | `{ game, players }` | `GameWithNextStep` | Add 2-4 players |
| `addExtraRules` | `{ game, extraRules }` | `GameWithNextStep` | Add optional extra rules |
| `startGame` | `{ game }` | `GameWithNextAction` | Start the game |
| `chooseDomino` | `{ game, lordId, dominoPick }` | `GameWithNextAction` | Pick a domino |
| `placeDomino` | `{ game, lordId, position, rotation }` | `GameState` | Place a domino on kingdom |
| `discardDomino` | `{ game, lordId }` | `GameState` | Discard when no placement exists |
| `getResults` | `{ game }` | `GameWithResults` | Get final rankings and scores |
| `calculateScore` | `{ kingdom }` | `Score` | Calculate score for a kingdom |
| `getValidPlacements` | `{ kingdom, domino }` | `ValidPlacement[]` | Find all valid placements |
| `canPlaceDomino` | `{ kingdom, domino }` | `boolean` | Check if any placement exists |
| `serialize` | `{ game }` | `string` | Serialize game state to JSON |
| `deserialize` | `{ json }` | `GameState` | Restore game state from JSON |

## Development

### Setup

To set up the project for development:

1. Clone the repository:
   ```bash
   git clone https://github.com/Pompidup/KDomino.git
   cd KDomino
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

### Testing

The project uses Vitest for testing:

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test -- --run

# Run tests with coverage
pnpm coverage

# Run a specific test file
pnpm test -- src/tests/unit/useCases/calculateScore.test.ts --run
```

### Linting and Type Checking

```bash
# Lint with Biome
pnpm lint

# Type check with TypeScript
pnpm typecheck
```

### Building

To build the project (ESM output to `dist/`):

```bash
pnpm build
```

## Contributing

Contributions are welcome! Here's how you can contribute:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Run tests to ensure everything works (`pnpm test -- --run`)
5. Run type checking (`pnpm typecheck`)
6. Commit your changes (`git commit -m 'Add some feature'`)
7. Push to the branch (`git push origin feature/your-feature-name`)
8. Open a Pull Request

Please make sure your code follows the existing style and includes appropriate tests.
