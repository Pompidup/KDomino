# Queendomino Mode

## Overview

Queendomino extends the base Kingdomino game with an economic layer. On top of the standard domino placement mechanics, players collect coins, hire knights to tax territories, purchase buildings from a shared Builders Board, compete for the Queen's favor through towers, and can unleash the Dragon to destroy opponents' building options.

Key additions over the base game:

- **Coins** -- a currency used to buy buildings and burn tiles with the Dragon
- **Construction squares** -- special squares on certain domino tiles where buildings can be placed
- **Buildings** -- tiles purchased from the Builders Board that add crowns, towers, and end-game scoring bonuses
- **Knights** -- placed on territories to collect tax (coins) based on construction squares
- **Towers** -- accumulated through buildings, determine who holds the Queen
- **The Queen** -- at the end of the game, counts as +1 crown on your largest territory
- **The Dragon** -- destroys a building on the Builders Board (costs coins, once per round)

The game uses 48 dominoes (instead of the Classic mode's 48), some of which have construction squares on their tiles.

## Getting Started

```typescript
import {
  createGameEngine,
  isGameWithNextAction,
  playerActions,
} from "@pompidup/kingdomino-engine";

const engine = createGameEngine({});

// Create a QueenDomino game
let game = engine.createGame({ mode: "QueenDomino" });

// Add players (2-4 players)
game = engine.addPlayers({ game, players: ["Alice", "Bob"] });

// Start the game
game = engine.startGame({ game });

// Access Queendomino-specific state
console.log(game.queendomino?.buildersBoard.slots); // 4 visible buildings
console.log(game.players[0]?.coins);    // 7 (starting coins)
console.log(game.players[0]?.towers);   // 0
console.log(game.players[0]?.knights);  // []
console.log(game.players[0]?.buildings); // []
```

## New Concepts

### Construction Squares

Some domino tiles have a `hasConstructionSquare` property set to `true`. These squares serve two purposes:

1. **Buildings** can be placed on them (one building per construction square).
2. **Knights** collect taxes based on the number of construction squares in their territory.

Construction squares are part of the domino tile data:

```typescript
type Tile = {
  type: Ground;      // "wheat", "forest", "sea", etc.
  crowns: Crown;
  hasConstructionSquare?: boolean; // true if this tile can hold a building
};
```

### Coins

Each player starts with **7 coins**. Coins are spent to:

- Purchase buildings from the Builders Board
- Use the Dragon to destroy a building on the board

Coins are earned through:

- Knight tax collection (based on construction squares in the territory)
- Immediate bonuses from certain buildings

### Towers

Towers are accumulated through building construction. The player with the most towers holds the Queen. Some buildings grant towers directly (via `towers` property), and others grant towers as an immediate bonus.

> In the official game, a player hosts the Queen as soon as they reach the most towers "even in the case of a tie"; the engine keeps her with the current holder on a tie (see [Rule decisions](#rule-decisions-and-simplifications)).

### Buildings

Buildings are tiles purchased from the Builders Board and placed on construction squares in your kingdom. They can provide:

- **Crowns** added to the tile (increasing territory scoring)
- **Towers** (influencing Queen ownership)
- **Immediate bonuses** (coins, towers, or knights granted on purchase)
- **End-game scoring** (bonus points calculated at game end)

### Knights

Knights are placed **on the domino you have just placed** to collect taxes. When a knight is placed, you receive coins equal to the number of construction squares in that territory (determined by BFS flood-fill). Each player can place a maximum of **3 knights** (plus one per knight granted by a building's immediate bonus), and each territory can only have **one knight**.

### The Queen

The Queen is held by the player with the most towers. At the end of the game she is placed on the holder's **largest territory** (most squares) where she counts as **+1 crown** (effectively adding `size` bonus points). If tower counts are tied, the Queen stays with the current holder.

### The Dragon

The Dragon can be used once per round by any player who does **not** hold the Queen. Using the Dragon costs coins equal to the target building's cost and removes that building from the Builders Board. The emptied slot stays empty until the end of the round, when the board is refilled from the draw pile.

## Turn Flow

In Queendomino, the turn sequence is extended with three optional actions after placing a domino. The full sequence for each lord's turn is:

```
placeDomino --> placeKnight --> constructBuilding --> useDragon --> pickDomino
                (optional)       (optional)          (optional)
```

After placing a domino, the engine automatically sets the next action to `placeKnight`. The player can either execute the optional action or skip it with `skipOptionalAction`. Skipping advances to the next optional action in the sequence. After all optional actions are handled (executed or skipped), the engine advances to `pickDomino` (the same lord picks a new domino, then the next lord plays).

After **discarding** a domino, the engine sets the next action to `constructBuilding`: a knight can only be placed on the domino just placed, so `placeKnight` is skipped, but the player may still construct a building and use the Dragon (official rule: only the placement step A is replaced by the discard, actions C and D remain available).

On the last round there is no domino left to pick: after the optional actions of the last lord, the game goes to the `result` step.

### New round

When every lord has picked a new domino, a new round starts and the engine:

1. sends the Dragon back to its cave (`dragonUsedThisRound` is reset to `false`);
2. refills the empty slots of the Builders Board from the draw pile (as long as it is not empty).

### Action Sequence Diagram

```
        +----------------+          +----------------+
        |  placeDomino   |          | discardDomino  |
        +-------+--------+          +-------+--------+
                |                           |
                v                           |
     +----------+----------+                |
     |    placeKnight      |                |
     | (optional - skip?)  |                |
     +----------+----------+                |
       execute   |   skip                   |
         |       |     |                    |
         +---+---+-----+                    |
             +--------------+---------------+
                            |
                            v
                   +--------+-----------+
                   |  constructBuilding |
                   | (optional - skip?) |
                   +--------+-----------+
                    execute  |    skip
                      |      |      |
                      +--+---+------+
                         |
                         v
                    +----+--------+
                    |  useDragon  |
                    | (opt-skip?) |
                    +----+--------+
                  execute |   skip
                    |     |     |
                    +--+--+-----+
                       |
                       v
                  +----+------+
                  | pickDomino|
                  | (next lord|
                  |  or end)  |
                  +-----------+
```

### Handling Optional Actions in Code

```typescript
while (isGameWithNextAction(game)) {
  const action = game.nextAction.nextAction;
  const lordId = game.nextAction.nextLord;

  if (action === playerActions.placeDomino) {
    // Place or discard domino (same as base game)
    // ...
  } else if (action === playerActions.placeKnight) {
    // Option A: Place a knight on one of the squares of the domino just placed
    const [square] = game.queendomino?.lastPlacedPositions ?? [];
    game = engine.placeKnight({ game, lordId, position: square! });

    // Option B: Skip
    game = engine.skipOptionalAction({ game, lordId });
  } else if (action === playerActions.constructBuilding) {
    // Option A: Buy and place a building
    game = engine.constructBuilding({
      game,
      lordId,
      buildingId: 8,
      position: { x: 4, y: 3 },
    });

    // Option B: Skip
    game = engine.skipOptionalAction({ game, lordId });
  } else if (action === playerActions.useDragon) {
    // Option A: Burn a building on the Builders Board
    game = engine.useDragon({ game, lordId, buildingId: 5 });

    // Option B: Skip
    game = engine.skipOptionalAction({ game, lordId });
  } else if (action === playerActions.pickDomino) {
    // Pick a domino (same as base game)
    // ...
  }
}
```

## Buildings

### The Builders Board

The Builders Board holds **4 visible building slots**, drawn from a shuffled draw pile. When a building is purchased or destroyed by the Dragon, its slot stays empty (`null`) for the rest of the round. At the start of each new round, every empty slot is refilled from the draw pile, as long as the pile is not empty (official rule: "When a building is constructed, it leaves an empty spot on the Builders' Board for the duration of the round" and, when starting a new round, "fill the empty spots with Building Tiles from the draw pile").

Access the board through the game state:

```typescript
const board = game.queendomino?.buildersBoard;
console.log(board?.slots);    // Array of 4 BuildingSlot (BuildingTile | null)
console.log(board?.drawPile); // Remaining tiles
```

### Purchasing and Placing a Building

To construct a building, you need:

1. Enough coins to pay the building's `cost`
2. An open construction square on your kingdom (a tile with `hasConstructionSquare: true` that does not already have a building)

```typescript
game = engine.constructBuilding({
  game,
  lordId: "lord-1",
  buildingId: 8,                // ID of the building on the Builders Board
  position: { x: 3, y: 2 },    // Construction square position on your kingdom
});
```

When a building is purchased:

1. The cost is deducted from the player's coins.
2. Any **immediate bonus** is applied (coins, towers, or extra knights).
3. The building's **towers** are added to the player's tower count.
4. The building's **crowns** are added to the kingdom tile at the placement position.
5. The **Queen holder** is recalculated based on the new tower counts.
6. The building slot on the Builders Board is emptied (and refilled at the start of the next round).

### Building Properties

Each `BuildingTile` has the following structure:

```typescript
type BuildingTile = {
  id: number;
  name: string;
  cost: number;                      // Cost in coins
  immediateBonus?: ImmediateBonus;   // Bonus on purchase
  crowns: number;                    // Crowns added to the tile
  towers: number;                    // Towers granted
  endGameScoring?: EndGameScoring;   // End-game bonus condition
};
```

### Immediate Bonuses

Some buildings grant a bonus immediately when purchased:

| Bonus Type | Effect |
|------------|--------|
| `coins`    | Add coins to the player |
| `tower`    | Add towers to the player |
| `knight`   | Raise the player's knight limit by `amount` (`player.bonusKnights`) |

### End-Game Scoring Types

Buildings with `endGameScoring` grant bonus points at the end of the game:

| Scoring Type  | Description | Example |
|---------------|-------------|---------|
| `flat`        | Fixed bonus points | The Guard Tower: 2 flat points |
| `perBuilding` | Points per building the player owns | The Church: 2 pts per building |
| `perTower`    | Points per tower the player owns | The Fountain: 2 pts per tower |
| `perCrown`    | Points per crown in the kingdom | The Magic School: 1 pt per crown |
| `perTerrain`  | Points per tile of a specific terrain | The Sawmill: 1 pt per forest tile |

### Available Buildings

The game includes 18 buildings:

| Name | Cost | Crowns | Towers | Immediate Bonus | End-Game Scoring |
|------|------|--------|--------|-----------------|------------------|
| The Bakery (x2) | 1 | 0 | 0 | +2 coins | -- |
| The Sawmill | 2 | 0 | 0 | -- | 1 pt/forest tile |
| The Fishmonger's (x2) | 2 | 0 | 0 | +1 coin | 1 pt/sea tile |
| The Weaving Shop | 3 | 1 | 0 | -- | 1 pt/wheat tile |
| The Magic School | 4 | 1 | 0 | -- | 1 pt/crown |
| The Fountain | 3 | 0 | 1 | -- | 2 pts/tower |
| The Church | 4 | 1 | 0 | -- | 2 pts/building |
| The Bath | 2 | 0 | 0 | +1 coin | 4 flat pts |
| The Guard Tower (x2) | 1 | 0 | 1 | -- | 2 flat pts |
| The Big Tower | 3 | 0 | 2 | -- | 4 flat pts |
| The Guardhouse | 2 | 0 | 1 | -- | 1 pt/building |
| The Fortified Castle | 5 | 2 | 1 | -- | 6 flat pts |
| The Travelling Castle | 3 | 1 | 1 | -- | 1 pt/tower |
| The Travelling Group | 2 | 0 | 0 | +1 coin | 1 pt/building |
| The Harbour | 3 | 0 | 0 | -- | 2 pts/sea tile |

## Knights

### Placing a Knight

A knight can only be placed on one of the two squares of the **domino you have just placed** (official rule: "Take a Knight and place it on the domino you just added"). These squares are exposed as `game.queendomino.lastPlacedPositions`. Other rules:

- Maximum **3 knights** per player, plus `player.bonusKnights` (knights granted by building immediate bonuses)
- Only **one knight per territory** (contiguous group of same-terrain tiles)
- One knight per turn (`placeKnight` then moves on to `constructBuilding`)
- No knight can be placed after discarding a domino

Any other position is rejected with `CANNOT_PLACE_KNIGHT`.

```typescript
const [square] = game.queendomino?.lastPlacedPositions ?? [];
game = engine.placeKnight({
  game,
  lordId: "lord-1",
  position: square!, // One of the squares of the domino just placed
});
```

### Tax Collection

When a knight is placed, the engine immediately collects taxes. The tax amount equals the number of **construction squares** in the territory where the knight is placed. The territory is determined by BFS flood-fill from the knight's position, finding all contiguous tiles of the same terrain type.

For example, if a knight is placed on a forest territory that contains 3 construction squares, the player receives 3 coins.

## The Queen

### Tower-Based Assignment

After each building is constructed, the engine recalculates who holds the Queen. The rules are:

1. The player with the **most towers** receives the Queen.
2. If there is a **tie** in tower count, the Queen **stays with the current holder** (or remains unassigned if no one holds her).
3. If no player has any towers, the Queen remains unassigned.

### The +1 Crown Bonus

At the end of the game, the Queen holder places her on their **largest territory** (the territory with the most connecting squares), where she counts as **+1 crown** (official rule, "End of the Game"). Since territory score = `size * crowns`, adding 1 crown to a territory with `C` crowns and `S` tiles changes the score from `S * C` to `S * (C + 1)`, granting a net bonus of `S` points (the territory's size) -- even if that territory had no crown.

The Queen bonus is calculated by `getResults` and does not modify the kingdom grid.

## The Dragon

### How to Use

The Dragon allows a player to destroy a building on the Builders Board, removing it from the game. This is a strategic tool to deny opponents access to powerful buildings.

```typescript
game = engine.useDragon({
  game,
  lordId: "lord-1",
  buildingId: 7, // ID of the building to destroy on the Builders Board
});
```

### Cost

Using the Dragon costs coins equal to the **target building's cost**. For example, destroying The Magic School (cost 4) requires 4 coins.

### Restrictions

- **Queen holder cannot use the Dragon.** The player currently holding the Queen is blocked from using the Dragon (error: `QUEEN_HOLDER_CANNOT_USE_DRAGON`).
- **Once per round.** The Dragon can only be used once per round across all players. After use, `dragonUsedThisRound` is set to `true` and the Dragon becomes unavailable until the next round, when it is reset to `false`.
- **No immediate refill.** The burned building's slot stays empty until the board is refilled at the start of the next round.
- **Must be available.** The `dragonAvailable` flag must be `true` and `dragonUsedThisRound` must be `false`.

## Scoring

Queendomino scoring builds on the base Kingdomino scoring (territory size multiplied by crowns in that territory) with these additions:

1. **Building crowns** -- When a building with crowns is placed on a construction square, those crowns are added directly to the tile. They count as regular crowns for territory scoring.

2. **Queen bonus** -- If a player holds the Queen at the end of the game, +1 crown is added to their largest territory. This grants bonus points equal to the size of that territory.

3. **End-game building bonuses** -- Each building with an `endGameScoring` property grants additional points based on its scoring type (see the Buildings section above). In Age of Giants + Queendomino, crowns covered by a giant are not counted by `perCrown`.

The final score returned by `getResults` (in `QueenDomino` and `AgeOfGiants-QueenDomino`) is: `base territory score + queen bonus + end-game building bonuses` (+ extra rules / Age of Giants quests when applicable).

## Complete Game Loop Example

```typescript
import {
  createGameEngine,
  isGameWithNextAction,
  playerActions,
  type GameState,
} from "@pompidup/kingdomino-engine";

const engine = createGameEngine({});

// Setup
let game: GameState = engine.createGame({ mode: "QueenDomino" });
game = engine.addPlayers({ game, players: ["Alice", "Bobby"] });
game = engine.startGame({ game });

// Game loop
while (isGameWithNextAction(game)) {
  const action = game.nextAction.nextAction;
  const lordId = game.nextAction.nextLord;

  switch (action) {
    case playerActions.pickDomino: {
      const unpicked = game.currentDominoes.find((d) => !d.picked);
      if (!unpicked) break;
      game = engine.chooseDomino({
        game,
        lordId,
        dominoPick: unpicked.domino.number,
      });
      break;
    }

    case playerActions.placeDomino: {
      const lord = game.lords.find((l) => l.id === lordId);
      const player = game.players.find((p) => p.id === lord?.playerId);
      if (!lord?.dominoPicked || !player) break;

      const placements = engine.getValidPlacements({
        kingdom: player.kingdom,
        domino: lord.dominoPicked,
      });

      if (placements.length > 0) {
        game = engine.placeDomino({
          game,
          lordId,
          position: placements[0]!.position,
          rotation: placements[0]!.rotation,
        });
      } else {
        game = engine.discardDomino({ game, lordId });
      }
      break;
    }

    case playerActions.pass: {
      game = engine.discardDomino({ game, lordId });
      break;
    }

    case playerActions.placeKnight: {
      // Knights can only go on the domino just placed
      const [square] = game.queendomino?.lastPlacedPositions ?? [];
      try {
        game = engine.placeKnight({ game, lordId, position: square! });
      } catch {
        // Knight limit reached or territory already taxed
        game = engine.skipOptionalAction({ game, lordId });
      }
      break;
    }

    case playerActions.constructBuilding: {
      const lord = game.lords.find((l) => l.id === lordId);
      const player = game.players.find((p) => p.id === lord?.playerId);
      const board = game.queendomino?.buildersBoard;

      // Example: buy the cheapest building if we can afford it
      // and have an open construction square
      if (player && board) {
        const affordable = board.slots
          .filter((s): s is NonNullable<typeof s> => s !== null)
          .filter((b) => b.cost <= (player.coins ?? 0))
          .sort((a, b) => a.cost - b.cost);

        if (affordable.length > 0) {
          // Would need to find a valid construction square position
          // For simplicity, skip here:
          game = engine.skipOptionalAction({ game, lordId });
        } else {
          game = engine.skipOptionalAction({ game, lordId });
        }
      } else {
        game = engine.skipOptionalAction({ game, lordId });
      }
      break;
    }

    case playerActions.useDragon: {
      // Example: skip using the Dragon
      game = engine.skipOptionalAction({ game, lordId });
      break;
    }

    default: {
      // Handle any unexpected action by skipping
      game = engine.skipOptionalAction({ game, lordId });
      break;
    }
  }
}

// Get final results
const results = engine.getResults({ game });
for (const result of results.result) {
  console.log(`#${result.position} - ${result.playerName}: ${result.score} points`);
}
```

## New Engine Methods

| Method | Command Type | Parameters | Description |
|--------|-------------|------------|-------------|
| `placeKnight` | `PlaceKnightCommand` | `game`, `lordId`, `position: { x, y }` | Places a knight on one of the squares of the domino just placed (`queendomino.lastPlacedPositions`). Collects tax (coins) equal to the number of construction squares in the territory. |
| `constructBuilding` | `ConstructBuildingCommand` | `game`, `lordId`, `buildingId`, `position: { x, y }` | Purchases a building from the Builders Board and places it on a construction square. Deducts cost, applies bonuses, recalculates Queen holder. |
| `useDragon` | `UseDragonCommand` | `game`, `lordId`, `buildingId` | Destroys a building on the Builders Board. Costs coins equal to the building's cost. Cannot be used by the Queen holder. Once per round. |
| `skipOptionalAction` | `SkipOptionalActionCommand` | `game`, `lordId` | Skips the current optional action (`placeKnight`, `constructBuilding`, or `useDragon`) and advances to the next one in the sequence. |

All four methods accept a `GameWithNextAction` as the `game` parameter and return `GameState`.

## New Types

Key types exported from `@pompidup/kingdomino-engine` for Queendomino:

```typescript
// Queendomino game state (available on game.queendomino)
type QueenDominoState = {
  buildersBoard: BuildersBoard;
  queenHolderId: string | null;
  dragonAvailable: boolean;
  dragonUsedThisRound: boolean;   // reset to false at each new round
  lastPlacedPositions?: Position[]; // squares of the domino just placed
};

// The Builders Board
type BuildersBoard = {
  slots: BuildingSlot[];       // 4 visible slots (BuildingTile | null)
  drawPile: BuildingTile[];    // Remaining tiles
};

// A building tile
type BuildingTile = {
  id: number;
  name: string;
  cost: number;
  immediateBonus?: ImmediateBonus;
  crowns: number;
  towers: number;
  endGameScoring?: EndGameScoring;
};

// Immediate bonus on purchase
type ImmediateBonus = {
  type: "coins" | "tower" | "knight";
  amount: number;
};

// End-game scoring rule
type EndGameScoring = {
  type: "perTerrain" | "perBuilding" | "perTower" | "perCrown" | "flat";
  terrain?: string;  // Only for "perTerrain"
  points: number;
};

// A building placed on the kingdom
type PlacedBuilding = {
  building: BuildingTile;
  position: Position;
};

// A knight on the kingdom
type Knight = {
  playerId: string;
  position: Position;
};

// Player extensions (these fields are present on Player in QueenDomino mode)
type Player = {
  // ... base fields ...
  coins?: number;
  towers?: number;
  knights?: Knight[];
  bonusKnights?: number;   // extra knights granted by building bonuses
  buildings?: PlacedBuilding[];
};

// New player actions
const playerActions = {
  // ... base actions ...
  placeKnight: "placeKnight",
  constructBuilding: "constructBuilding",
  useDragon: "useDragon",
  skipOptionalAction: "skipOptionalAction",
};
```

## Rule Decisions and Simplifications

The engine follows the official Queendomino rulebook (Blue Orange, 2017) for:

- **Turn order** -- A (place or discard) → B (knight, only on the domino just placed) → C (construct) → D (Dragon) → E (pick). A player who discards skips B but may still do C and D.
- **Builders Board** -- emptied slots stay empty for the round and are refilled at the start of the next round.
- **Dragon** -- once per round for all players, back in its cave at each new round; the Queen holder cannot use it.
- **Queen** -- at the end of the game, +1 crown on the holder's largest territory.

It keeps some simplifications of the board game:

- 4 Builders Board slots and 18 building tiles with intrinsic costs (the board game has 6 slots and 32 tiles; remaining tiles are not slid to the cheapest spots since slot position carries no cost).
- The Dragon costs the target building's cost (1 coin in the board game).
- Knight tax counts construction squares in the territory (the board game counts all squares), at most one knight per territory and one knight per turn (the board game allows 2 per turn and several per territory), and a base limit of 3 knights (the board game starts with 1 knight).
- The Queen stays with her current holder on a tower tie and grants no construction discount.
- Unused coins are not converted into points at the end of the game (1 point per 3 coins in the board game).
- In 2-player games the default kingdom is 5x5 with 24 dominoes; the official 7x7 / 48-domino setup is available through the `The Mighty Duel` extra rule.
