# Kingdomino Engine

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
import gameEngine from "@pompidup/kingdomino-engine";

const engine = gameEngine();
let gameState = engine.createGame({ mode: "Classic" });

```

### Adding Players

Add players to the game by passing an array of player names:

```typescript
gameState = engine.addPlayers(gameState, ["Player 1", "Player 2", "Player 3"]);
```

### Setting Up Extra Rules

You can get available extra rules and add them to the game:

```typescript
const extraRules = engine.getExtraRules({ mode: "Classic", players: 2 });
gameState = engine.addExtraRules({
game: gameState,
extraRules: ["The middle Kingdom"],
});
```

### Starting the Game

After setting up players and rules, start the game:

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
  dominoPick: 12
});
```

- Place Domino:

```typescript
gameState = engine.placeDomino({
  game: gameState,
  lordId: "lordId",
  position: { x: 0, y: 0 },
  orientation: "horizontal",
  rotation: 0
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

### Scoring

When the last turn is played, the game will automatically calculate and provide the final score for each player and their position.

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
  placeDomino: (command: PlaceDominoCommand) => GameWithNextAction | GameWithNextStep;
  discardDomino: (command: DiscardDominoCommand) => GameWithNextAction | GameWithNextStep;
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
  nextAction: "pickDomino" | "placeDomino";
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

#### placeDomino(command: PlaceDominoCommand): GameWithNextAction | GameWithNextStep

Allows a player to place a domino on their kingdom.

#### discardDomino(command: DiscardDominoCommand): GameWithNextAction | GameWithNextStep

Allows a player to discard a domino if they cannot place it.

#### getResults(command: GetResultCommand): GameWithResults

Calculates and returns the final game results.

## Advanced Usage

For more advanced usage and detailed API documentation, please refer to the source code and inline comments.

