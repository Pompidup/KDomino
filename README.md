# Kingdomino Engine

## Overview

This is under development. The goal is to create a simple and lightweight TypeScript engine designed to facilitate the gameplay of Kingdomino. It provides the core logic for managing game states, rules, and player interactions, making it easy to integrate into any application that requires a Kingdomino game engine.

## Features

- **Game State Management**: Efficiently manage game states, including player turns, game rules, and game progression.
- **Rule Enforcement**: Automatically enforce game rules, ensuring a fair and consistent gameplay experience.
- **Player Interaction**: Simplify player interactions, including drawing tiles, placing dominoes, and scoring.

## Installation

To install the Kingdomino Engine, you can use npm, yarn or pnpm. Run the following command in your terminal:

```bash
npm install @pompidup/kingdomino-engine
```

or

```bash
yarn add @pompidup/kingdomino-engine
```

or

```bash
pnpm add @pompidup/kingdomino-engine
```

## Usage

The Kingdomino Engine is designed to be easy to use and integrate into any application. Below are some examples of how you can use the engine to create a new game, add players, and start playing.

Each method returns an updated game state object, which contains the current state of the game, including the board, players, and dominoes. In return you will receive too the nextKing (the next player to play) and the nextAction (the next action to be performed by the next player).

**It's your responsibility to save and pass the updated game state to the next method call.**

### Basic Setup

To start using the Kingdomino Engine, you need to import it and initialize a new game instance.

```typescript
import gameEngine from "@pompidup/kingdomino-engine";

const engine = gameEngine();
let gameState = engine.init();
```

### Start game and setting up players

You can add players to the game by passing an array of player.

```typescript
const players = [{ name: "Player  1" }, { name: "Player  2" }];
gameState = engine.start(gameState, players);
```

### Choosing game mode (Classic, Queendomino...)

Incoming...

### Setting Up Rules

Incoming...

### Player Actions

Players can perform actions like pick domino, placing domino, and passing turns.

- Pick Domino:
  You can pick a domino by passing the kingId and the number of the domino you want to pick.

```typescript
gameState = engine.pickDomino(gameState, "kingId", 12);
```

- Place Domino:
  You can place a domino by passing the kingId, the position where you want to place the domino, the orientation (horizontal or vertical), and the rotation (if you want to switch left and right tile you can pass 180 else 0).

```typescript
gameState = engine.placeDomino(
  gameState,
  "kingId",
  { x: 0, y: 0 },
  "horizontal",
  0
);
```

- Pass Turn:
  If you can not place a domino you can pass your turn.

```typescript
gameState = engine.passTurn(gameState, "kingId");
```

### Scoring

When last turn is played, you will received the final score of each player and their position.
