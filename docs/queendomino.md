# Queendomino Mode

## Overview

Queendomino extends the base Kingdomino game with an economic layer. On top of the standard domino placement mechanics, players collect coins, send knights to tax territories, purchase buildings from a shared Builders Board, compete for the Queen's favor through towers, and can bribe the Dragon to destroy opponents' building options.

The engine follows the official rulebook (Blue Orange, 2017 — see [Sources](#sources)); the few remaining differences are listed in [Rule Decisions and Simplifications](#rule-decisions-and-simplifications).

Key additions over the base game:

- **Coins** -- a currency used to buy buildings and bribe the Dragon; 1 point per 3 unused coins at the end of the game
- **Construction squares** -- special squares on certain domino tiles where buildings can be placed
- **Buildings** -- tiles purchased from the Builders Board (6 spots costing 5 to 0 coins) that add crowns, towers, and end-game scoring bonuses
- **Knights** -- placed on the domino just placed to collect tax: 1 coin per square of the territory
- **Towers** -- accumulated through buildings, determine who hosts the Queen
- **The Queen** -- lowers her host's construction costs by 1 coin; at the end of the game, counts as +1 crown on the host's largest territory
- **The Dragon** -- burns a building on the Builders Board (1 coin, once per round)

The game uses the 48 Queendomino dominoes, some of which have construction squares on their tiles. Every domino is used at every player count: at **2 players** each player builds a **7x7** kingdom with 2 kings over 12 rounds (official rule), at 3-4 players a 5x5 kingdom.

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
console.log(game.rules.basic.maxKingdomSize); // 7: 7x7 kingdom at 2 players

// Start the game
game = engine.startGame({ game });

// Access Queendomino-specific state
console.log(game.queendomino?.buildersBoard.slots);     // 6 visible buildings
console.log(game.queendomino?.buildersBoard.slotCosts); // [5, 4, 3, 2, 1, 0]
console.log(game.players[0]?.coins);    // 7 (starting coins)
console.log(game.players[0]?.towers);   // 0
console.log(game.players[0]?.knights);  // [] (1 knight available, none placed)
console.log(game.players[0]?.buildings); // []
```

> At 2 players the kingdom is 7x7: pass `maxKingdomSize: game.rules.basic.maxKingdomSize` to `getValidPlacements` / `canPlaceDomino` (the default is 5).

## New Concepts

### Construction Squares

Some domino tiles have a `hasConstructionSquare` property set to `true`. These squares serve two purposes:

1. **Buildings** can be placed on them (one building per construction square).
2. They form the **towns** (red terrain) of the kingdom, whose territories score like any other territory.

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

- Purchase buildings from the Builders Board (the price of the spot, minus 1 coin for the Queen's host)
- Bribe the Dragon to burn a building on the board (1 coin)

Coins are earned through:

- Knight tax collection (1 coin per square of the territory)
- Immediate bonuses from certain buildings

At the end of the game, unused coins score **1 point per 3 coins** ("Wealth", a `wealth` bonus of the score breakdown).

### Towers

Towers are accumulated through building construction. As soon as a player has the most towers — even in the case of a tie — they host the Queen. Some buildings grant towers directly (via `towers` property), and others grant towers as an immediate bonus.

### Buildings

Buildings are tiles purchased from the Builders Board and placed on construction squares in your kingdom. They can provide:

- **Crowns** added to the tile (increasing territory scoring)
- **Towers** (influencing Queen ownership)
- **Immediate bonuses** (coins, towers, or extra knights granted on purchase)
- **End-game scoring** (bonus points calculated at game end)

### Knights

Each player starts with **1 knight**, and gets more from the `knight` immediate bonus of some buildings (`player.bonusKnights`). Knights are placed **on the domino you have just placed** — up to **2 per turn**, one on each of its squares — to collect taxes: you receive **1 coin per square of the territory** the knight is placed on (determined by BFS flood-fill). Several knights may tax the same territory. A knight stays on its square until the end of the game.

### The Queen

The Queen is hosted by the player who reaches the most towers, **even on a tie**. While she is in your kingdom, your **construction costs are lowered by 1 coin** (a free spot stays free). At the end of the game she is placed on the host's **largest territory** (most squares) where she counts as **+1 crown** (effectively adding `size` bonus points).

### The Dragon

The Dragon can be used once per round by any player who does **not** host the Queen. Bribing the Dragon costs **1 coin**, whatever the building, and removes that building from the game. The emptied spot stays empty until the end of the round, when the board is refilled from the draw pile.

## Turn Flow

In Queendomino, the turn sequence is extended with three optional actions after placing a domino. The full sequence for each lord's turn is:

```
placeDomino --> placeKnight --> constructBuilding --> useDragon --> pickDomino
                (optional)       (optional)          (optional)
```

After placing a domino, the engine automatically sets the next action to `placeKnight`. The player can either execute the optional action or skip it with `skipOptionalAction`. Skipping advances to the next optional action in the sequence. After all optional actions are handled (executed or skipped), the engine advances to `pickDomino` (the same lord picks a new domino, then the next lord plays).

After a knight is placed, `placeKnight` **stays** the next action while a second knight can still be placed on the other square of the domino (the player has another knight available); skip it to move on to `constructBuilding`.

After **discarding** a domino, the engine sets the next action to `constructBuilding`: a knight can only be placed on the domino just placed, so `placeKnight` is skipped, but the player may still construct a building and use the Dragon (official rule: only the placement step A is replaced by the discard, actions C and D remain available).

On the last round there is no domino left to pick: after the optional actions of the last lord, the game goes to the `result` step.

### New round

When every lord has picked a new domino, a new round starts and the engine:

1. sends the Dragon back to its cave (`dragonUsedThisRound` is reset to `false`);
2. slides the buildings remaining on the Builders Board over to the cheapest spots, then fills the empty spots from the draw pile (as long as it is not empty).

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
    // Option A: Place a knight on a square of the domino just placed
    // (placeKnight comes back while a second knight can be placed)
    const [square] = engine.getValidKnightPositions({ game });
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
    // Option A: Burn a building on the Builders Board (1 coin)
    const [target] = engine.getValidDragonTargets({ game });
    game = engine.useDragon({ game, lordId, buildingId: target!.id });

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

The Builders Board holds **6 spots**, filled at the start of the game with the top 6 tiles of the shuffled draw pile. **The construction cost is carried by the spot**, not by the building: the spots cost **5, 4, 3, 2, 1 and 0 coins**, from the spot next to the draw pile to the cheapest one (`board.slotCosts`, aligned with `board.slots`).

- When a building is purchased or burnt by the Dragon, its spot stays empty (`null`) for the rest of the round ("When a building is constructed, it leaves an empty spot on the Builders' Board for the duration of the round").
- At the start of each new round, the buildings remaining on the board **slide over to the cheapest spots** (keeping their order), then the empty spots are filled from the draw pile, cheapest first, as long as the pile is not empty ("Slide the Building Tiles remaining on the Builders' Board over to the cheapest spots, and then fill the empty spots with Building Tiles from the draw pile").

Access the board through the game state:

```typescript
const board = game.queendomino?.buildersBoard;
console.log(board?.slots);     // Array of 6 BuildingSlot (BuildingTile | null)
console.log(board?.slotCosts); // [5, 4, 3, 2, 1, 0]: price of each spot
console.log(board?.drawPile);  // Remaining tiles
```

> A game saved before the official board (4 slots, no `slotCosts`) keeps its former behaviour once deserialized: each building costs its own `cost` and the board is refilled in place.

### Purchasing and Placing a Building

To construct a building, you need:

1. Enough coins to pay the **price of its spot** (`slotCosts[index]`), lowered by 1 coin (never below 0) if you host the Queen
2. An open construction square on your kingdom (a tile with `hasConstructionSquare: true` that does not already have a building)

`getAffordableBuildings` lists the buildings you can pay for and `getValidBuildingPositions` the squares where they can go.

```typescript
game = engine.constructBuilding({
  game,
  lordId: "lord-1",
  buildingId: 8,                // ID of the building on the Builders Board
  position: { x: 3, y: 2 },    // Construction square position on your kingdom
});
```

When a building is purchased:

1. The price (spot cost, Queen's discount included) is deducted from the player's coins.
2. Any **immediate bonus** is applied (coins, towers, or extra knights).
3. The building's **towers** are added to the player's tower count.
4. The building's **crowns** are added to the kingdom tile at the placement position.
5. If the player now has the most towers — even on a tie — they **host the Queen**.
6. The spot on the Builders Board is emptied (and refilled at the start of the next round).

### Building Properties

Each `BuildingTile` has the following structure:

```typescript
type BuildingTile = {
  id: number;
  name: string;
  cost: number;                      // Own cost (only used by boards without slotCosts)
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
| `knight`   | Grant `amount` extra knights (`player.bonusKnights`), usable from the next turn |

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

The engine ships 18 building tiles (`src/datasources/buildings.json`). They are **not** the 32 official tiles (see [Rule decisions](#rule-decisions-and-simplifications)). The `Cost` column is the tile's own cost, which no longer sets its price: the price is the cost of the spot the tile occupies.

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

A knight can only be placed on one of the two squares of the **domino you have just placed** (official rule: "Take a Knight and place it on the domino you just added"). These squares are exposed as `game.queendomino.lastPlacedPositions`. Other rules (official rulebook, action B):

- Each player starts with **1 knight**; the `knight` immediate bonus of a building grants more (`player.bonusKnights`). A player can place at most `1 + bonusKnights` knights over the game: `engine.getMaxKnights({ game, playerId })` returns this limit (0 outside Queendomino), so a client does not need to hard-code the starting knight count.
- **Up to 2 knights per turn**, one on each square of the domino just placed ("You may place up to 2 Knights during your turn, one for each square on the domino you just added"): after a knight is placed, `placeKnight` stays the next action while the other square can receive one; `skipOptionalAction` moves on to `constructBuilding`.
- **Several knights may tax the same territory** ("You may place a Knight on a territory where other Knights have been placed in previous rounds"); a square holds at most one knight.
- No knight can be placed after discarding a domino.

Any other position is rejected with `CANNOT_PLACE_KNIGHT`. `getValidKnightPositions` lists the accepted squares.

```typescript
const [square] = engine.getValidKnightPositions({ game });
game = engine.placeKnight({
  game,
  lordId: "lord-1",
  position: square!, // One of the squares of the domino just placed
});
```

### Tax Collection

When a knight is placed, the engine immediately collects taxes: **1 coin per square of the territory** where the knight is placed (official rule: "Immediately collect a Coin value equal to the number of connecting squares in the territory your Knight was placed on"). The territory is determined by BFS flood-fill from the knight's position, finding all contiguous tiles of the same terrain type (the castle is not part of any territory).

For example, if a knight is placed on a forest territory of 5 squares, the player receives 5 coins.

## The Queen

### Tower-Based Assignment

After each building is constructed, the engine checks who hosts the Queen (official rule: "As soon as your kingdom has acquired the most Towers (even in the case of a tie with another player), it hosts the Queen"):

1. The builder takes the Queen as soon as no other player has more towers — **a tie is enough**.
2. Otherwise she stays with her current host.
3. While no player has any tower, the Queen remains unassigned.

### Construction Discount

"When your kingdom hosts the Queen, she lowers your construction costs by 1 Coin": her host pays the price of the spot minus 1 coin, never below 0 (the free spot stays free, the 1-coin spot becomes free). `getAffordableBuildings` takes the discount into account.

### The +1 Crown Bonus

At the end of the game, the Queen holder places her on their **largest territory** (the territory with the most connecting squares), where she counts as **+1 crown** (official rule, "End of the Game"). Since territory score = `size * crowns`, adding 1 crown to a territory with `C` crowns and `S` tiles changes the score from `S * C` to `S * (C + 1)`, granting a net bonus of `S` points (the territory's size) -- even if that territory had no crown.

The Queen bonus is calculated by `getResults` and does not modify the kingdom grid.

## The Dragon

### How to Use

The Dragon allows a player to destroy a building on the Builders Board, removing it from the game. This is a strategic tool to deny opponents access to powerful buildings.

```typescript
// Buildings the Dragon can burn now (empty when it cannot be used)
const targets = engine.getValidDragonTargets({ game });
game = engine.useDragon({
  game,
  lordId: "lord-1",
  buildingId: targets[0]!.id, // ID of the building to destroy on the Builders Board
});
```

### Cost

Bribing the Dragon costs **1 coin**, whatever the building burnt (official rule: "Pay the bank 1 Coin").

### Restrictions

- **Queen holder cannot use the Dragon.** The player currently holding the Queen is blocked from using the Dragon (error: `QUEEN_HOLDER_CANNOT_USE_DRAGON`).
- **Once per round.** The Dragon can only be used once per round across all players. After use, `dragonUsedThisRound` is set to `true` and the Dragon becomes unavailable until the next round, when it is reset to `false`.
- **No immediate refill.** The burned building's spot stays empty until the board is refilled at the start of the next round.
- **One coin needed.** A player without coin cannot bribe the Dragon.

`getValidDragonTargets` returns the buildings `useDragon` accepts: every building of the board when all these conditions hold, `[]` otherwise.
- **Must be available.** The `dragonAvailable` flag must be `true` and `dragonUsedThisRound` must be `false`.

## Scoring

Queendomino scoring builds on the base Kingdomino scoring (territory size multiplied by crowns in that territory) with these additions:

1. **Building crowns** -- When a building with crowns is placed on a construction square, those crowns are added directly to the tile. They count as regular crowns for territory scoring.

2. **Queen bonus** -- If a player holds the Queen at the end of the game, +1 crown is added to their largest territory. This grants bonus points equal to the size of that territory.

3. **End-game building bonuses** -- Each building with an `endGameScoring` property grants additional points based on its scoring type (see the Buildings section above). In Age of Giants + Queendomino, crowns covered by a giant are not counted by `perCrown`.

4. **Wealth** -- 1 point for every 3 unused coins (official rule, "End of the Game"). It is a dedicated bonus of the score breakdown: `{ type: "wealth", label: TranslationKey.SCORE_WEALTH /* "score.wealth": "Wealth" / "Richesse" */, points }`, present for every player of a Queendomino game (0 points with fewer than 3 coins). During the game, `calculatePlayerScore` counts it on the current coins (provisional).

The final score returned by `getResults` (in `QueenDomino` and `AgeOfGiants-QueenDomino`) is: `base territory score + queen bonus + end-game building bonuses + wealth` (+ extra rules / Age of Giants quests when applicable).

**Tie-break** (official rule, "End of the Game": "In the event of a tie, the player with the largest territory [...] wins. If there is still a tie, the players share the victory."): on equal points `getResults` compares the largest territory only, never the crowns (unlike Kingdomino), then gives the tied players the same position (`tiebreaker: "largestTerritory"`, `tied: true`).

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
        maxKingdomSize: game.rules.basic.maxKingdomSize, // 7 at 2 players
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
      // Knights can only go on the domino just placed (up to 2 per turn)
      const [square] = engine.getValidKnightPositions({ game });
      game = square
        ? engine.placeKnight({ game, lordId, position: square })
        : engine.skipOptionalAction({ game, lordId });
      break;
    }

    case playerActions.constructBuilding: {
      // Example: build the first affordable building on the first free
      // construction square (both lists are empty when no construction is
      // possible)
      const [building] = engine.getAffordableBuildings({ game });
      const [position] = engine.getValidBuildingPositions({ game });
      game =
        building && position
          ? engine.constructBuilding({
              game,
              lordId,
              buildingId: building.id,
              position,
            })
          : engine.skipOptionalAction({ game, lordId });
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
| `placeKnight` | `PlaceKnightCommand` | `game`, `lordId`, `position: { x, y }` | Places a knight on a free square of the domino just placed (`queendomino.lastPlacedPositions`). Collects 1 coin per square of the territory. Stays on `placeKnight` while a second knight can be placed. |
| `constructBuilding` | `ConstructBuildingCommand` | `game`, `lordId`, `buildingId`, `position: { x, y }` | Purchases a building from the Builders Board and places it on a construction square. Pays the price of its spot (−1 coin for the Queen's host), applies bonuses, gives the Queen to the builder if they reach the most towers (even on a tie). |
| `useDragon` | `UseDragonCommand` | `game`, `lordId`, `buildingId` | Burns a building on the Builders Board for 1 coin. Cannot be used by the Queen's host. Once per round. |
| `skipOptionalAction` | `SkipOptionalActionCommand` | `game`, `lordId` | Skips the current optional action (`placeKnight`, `constructBuilding`, or `useDragon`) and advances to the next one in the sequence. |

All four methods accept a `GameWithNextAction` as the `game` parameter and return `GameState`.

Read-only queries listing what these actions accept (same checks as the actions, see [Valid targets](./api-reference.md#valid-targets-for-extension-actions)):

| Query | Returns | Action |
|-------|---------|--------|
| `getValidKnightPositions` | `Position[]` | `placeKnight` |
| `getValidBuildingPositions` | `Position[]` | `constructBuilding` |
| `getAffordableBuildings` | `BuildingTile[]` | `constructBuilding` |
| `getValidDragonTargets` | `BuildingTile[]` | `useDragon` |

`getMaxKnights({ game, playerId })` returns the knight limit of a player (`1 + bonusKnights`, any stage of the game; 0 outside Queendomino); the knights still available are `getMaxKnights(...) - (player.knights?.length ?? 0)`. It throws `NotFoundError` (`PLAYER_NOT_FOUND`) for an unknown player.

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
  slots: BuildingSlot[];       // 6 spots (BuildingTile | null)
  drawPile: BuildingTile[];    // Remaining tiles
  slotCosts?: number[];        // Price of each spot: [5, 4, 3, 2, 1, 0]
                               // (absent in games saved before the official board)
};

// A building tile
type BuildingTile = {
  id: number;
  name: string;
  cost: number;                // own cost, only used without slotCosts
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
  knights?: Knight[];      // knights placed
  bonusKnights?: number;   // knights granted by building bonuses (on top of the starting one)
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

The engine follows the official Queendomino rulebook (Blue Orange, 2017, see [Sources](#sources)) for:

- **Setup** -- 7 coins and 1 knight per player; every domino is used; 2 players build 7x7 kingdoms with 2 kings over 12 rounds, 3-4 players 5x5 kingdoms.
- **Turn order** -- A (place or discard) → B (knights, only on the domino just placed) → C (construct) → D (Dragon) → E (pick). A player who discards skips B but may still do C and D.
- **Knights** -- up to 2 per turn (one per square of the domino just placed), several per territory, 1 coin of tax per square of the territory; the `knight` building bonus grants extra knights.
- **Builders Board** -- 6 spots costing 5, 4, 3, 2, 1 and 0 coins; emptied spots stay empty for the round; at each new round the remaining tiles slide to the cheapest spots and the board is refilled from the draw pile.
- **Dragon** -- 1 coin, any building of the board, once per round for all players, back in its cave at each new round; the Queen's host cannot use it.
- **Queen** -- hosted by the player who reaches the most towers, even on a tie; −1 coin on her host's construction costs (never below 0); at the end of the game, +1 crown on the host's largest territory.
- **Wealth** -- 1 point per 3 unused coins at the end of the game.
- **Tie-break** -- largest territory, then shared victory (no crowns criterion).

Decisions and remaining differences:

- **Building tiles.** The official game has **32** building tiles (Bakery, Sawmill, Fishmonger's, Weaving Shop, Magic School, Foundry, Church, Safe, Small Tavern, Big Tavern, Guardtower, Fortified Castle, Travelling Castle, Training Camp, Statues, Queen's Tower...). Their individual content (immediate effect, crowns, towers, effects active during the game, end-game value) is printed on the tiles and is not listed in the rulebook text, so it could not be sourced reliably: the engine keeps its **18 tiles** (`src/datasources/buildings.json`), whose effects do not match the official tiles. With 18 tiles, 6 on the board and 12 in the draw pile, the board runs dry earlier than with 32. Not implemented for the same reason: the official effects "active during the game" (extra tax per knight owned / per tower) and the end-game "detached territory", "tower" and "knight" bonuses of the official tiles (the engine's `perTerrain`, `perTower`, `perBuilding`, `perCrown` and `flat` scorings are its own).
- **Spot costs.** The 6 spot costs (5, 4, 3, 2, 1, 0) are read from the board pictured in the rulebook ("The number below each tile represents the construction cost") and match published descriptions of the board ("a cost, ranging from 5 coins to 0, based on their position"). The tile's own `cost` is only used by boards saved before this change (no `slotCosts`).
- **Discount floor.** The rulebook does not say what the Queen's discount does on the free spot: the engine never goes below 0 (the free spot stays free, the 1-coin spot becomes free).
- **Second knight.** After a first knight, the engine offers `placeKnight` again only when the player still has a knight available and the other square of the domino is free; a square never holds two knights.
- **Supplies.** The box holds 22 knights, 15 towers and 42 coins; the engine does not limit these supplies.
- **The Mighty Duel.** Queendomino already plays 7x7 with every domino at 2 players. "The Mighty Duel" stays an accepted extra rule of QueenDomino at 2 players for backward compatibility, **without any further effect** (same setup, same domino order). Games created before this change keep the 5x5 / 24-domino setup they were started with (the setup is stored in `game.rules.basic`).
- **Kingdom grid.** Kingdoms are stored in a 9x9 grid centered on the castle (`GRIDSIZE`), so in a 7x7 kingdom the castle is at most 2 squares away from the centre in each direction.

## Sources

- Official Queendomino rulebook, Blue Orange 2017 (English): <http://boardgame.bg/queendomino%20rules.pdf>, cross-checked with <https://bghub.org/r/queendomino.pdf> and the European edition <https://board-game-rules.com/wp-content/uploads/2025/01/queendomino_Official-Rules.pdf>. Quoted rules: Set up (E, J), actions B, C and D, "Building Bonuses", "Starting a New Round", "End of the Game".
- Builders' Board spot costs: board picture of the rulebook (Set up, page 2 and "Starting a New Round", page 5), and the BoardGameGeek review "Queendomino – A Detailed Review" (<https://boardgamegeek.com/thread/2281152/queendomino-a-detailed-review>).
- Age of Giants rulebook (<https://cdn.1j1ju.com/medias/bd/76/99-kingdomino-age-of-giants-rulebook.pdf>): selecting and connecting dominoes "is done exactly the same way as in both Kingdomino and Queendomino games"; only the 5-domino lines and the giants are specific.
