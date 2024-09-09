# Kingdomino Engine

[![Node.js CI](https://github.com/Pompidup/KDomino/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/Pompidup/KDomino/actions/workflows/node.js.yml)
![Branches](./badges/coverage-branches.svg)
![Functions](./badges/coverage-functions.svg)
![Lines](./badges/coverage-lines.svg)
![Statements](./badges/coverage-statements.svg)
![Coverage total](./badges/coverage-total.svg)

## Overview

This is a simple and lightweight TypeScript engine designed to facilitate the gameplay of Kingdomino. It provides the core logic for managing game states, rules, and player interactions, making it easy to integrate into any application that requires a Kingdomino game engine.

## Requirements

- Node v20.6.0 or higher

## Features

- **Game State Management**: Efficiently manage game states, including player turns, game rules, and game progression.
- **Rule Enforcement**: Automatically enforce game rules, ensuring a fair and consistent gameplay experience.
- **Player Interaction**: Simplify player interactions, including drawing tiles, placing dominoes, and scoring.
- **Extra Rules Support**: Implement and manage additional game rules for enhanced gameplay.
- **Multiple Game Modes**: Support for different game modes, including Classic and potentially others.

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
import createGameEngine from "@pompidup/kingdomino-engine";

const engine = createGameEngine({});
let gameState = engine.createGame({ mode: "Classic" });
```

### Options for GameEngine

You can pass options to the `createGameEngine` function to customize the engine's behavior. The available options are:

- `logging`: Enable or disable logging for debugging purposes. Default is `false`.
- `shuffleMethod`: Specify the method used to shuffle dominoes. If not specified, a default shuffle method will be used.
- `uuidMethod`: Specify the method used to generate UUIDs. If not specified, a default UUID method will be used.

Here's an example of how to pass options to the engine:

```typescript
// Full custom options
const options: EngineConfig = {
  logging: true,
  shuffleMethod: myCustomShuffleMethod,
  uuidMethod: myCustomUuidMethod,
};

const engine = createGameEngine(options);

// If you want default options
const engine = createGameEngine({});
```

### Adding Players

Add players to the game by passing an array of player names:

```typescript
gameState = engine.addPlayers({gameState, ["Player 1", "Player 2", "Player 3"]});
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

You can add extra rules to the game to modify gameplay. For example, you can add the "The Middle Kingdom" rule:

```typescript
gameState = engine.addExtraRules({
  game: gameState,
  extraRules: ["The middle Kingdom"],
});
```

### Starting the Game

After setting up players and rules, start the game, the engine will automatically set up the initial game state and determine the first player (lord) to play in nextAction.

```typescript
gameState = engine.startGame({ game: gameState });
```

### Player Actions

Players can perform actions like picking a domino, placing a domino, and discarding a domino.

- Pick Domino:

```typescript
gameState = engine.chooseDomino({
  game: gameState,
  lordId: "lordId",
  dominoPick: 12,
});
```

- Place Domino:

```typescript
gameState = engine.placeDomino({
  game: gameState,
  lordId: "lordId",
  position: { x: 0, y: 0 },
  orientation: "horizontal",
  rotation: 0,
});
```

- Discard Domino:

```typescript
gameState = engine.discardDomino({
  game: gameState,
  lordId: "lordId",
});
```

### Game Flow

The game progresses through various steps and actions. The `nextAction` property in the game state indicates what action should be taken next. This could be a step (like "addPlayers", "options", "start", or "result") or an action (like "pickDomino" or "placeDomino").
Once the game is started you will receive the nextAction and nextLord, when you receive a nextStep the game isOver.
You can use utility functions to check the game state and determine the next action to take.

```typescript
while (isGameWithNextAction(gameState)) {
  // Manage player actions
}

if (isGameWithNextStep(gameState)) {
  // Manage game steps, like adding players or showing results
}
```

### Scoring

When the last turn is played, the game will automatically calculate the final score for each player and their position.
You can get the results by calling the `getResults` method:

```typescript
gameState = engine.getResults({ game: gameState });
```

## Extra Rules

The engine supports extra rules that can modify gameplay. Some examples include:

- **The Middle Kingdom**: Gain 10 additional points if your castle is in the middle of the kingdom.
- **Harmony**: Gain 5 additional points if your kingdom is complete (no discarded dominoes).

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
};
```

#### Game

Represents the current state of a Kingdomino game.

```typescript
type Game = {
  id: string;
  dominoes: Domino[];
  currentDominoes: RevealedDomino[];
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

### Methods

#### createGame(command: CreateGameCommand): GameWithNextStep

Creates a new game with the specified game mode.

#### addPlayers(command: AddPlayersCommand): GameWithNextStep

Adds players to the game.

#### addExtraRules(command: AddExtraRulesCommand): GameWithNextStep

Adds extra rules to the game.

#### startGame(command: StartGameCommand): GameWithNextAction

Starts the game, setting up the initial game state.

#### chooseDomino(command: ChooseDominoCommand): GameWithNextAction

Allows a player to choose a domino.

#### placeDomino(command: PlaceDominoCommand): GameState

Allows a player to place a domino on their kingdom.

#### discardDomino(command: DiscardDominoCommand): GameState

Allows a player to discard a domino if they cannot place it.

#### getResults(command: GetResultCommand): GameWithResults

Calculates and returns the final game results.

## Advanced Usage

For more advanced usage and detailed API documentation, please refer to the source code and inline comments.
