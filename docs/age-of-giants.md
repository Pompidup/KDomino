# Age of Giants

Age of Giants is an official expansion that adds giants, quest tiles, and 5-player support to Kingdomino. It can be played on top of Classic Kingdomino or combined with QueenDomino.

## Modes

### AgeOfGiants

The base Age of Giants mode, built on Classic Kingdomino rules.

- **60 dominos**: 48 original + 12 new (with giant and footprint symbols)
- **5 dominos per turn** (excess discarded for fewer players)
- **1-5 players** supported
- **6 giant figurines** in the pool
- **2 quest tiles** drawn at game start

### AgeOfGiants-QueenDomino

Age of Giants combined with QueenDomino. Includes all QueenDomino mechanics (buildings, knights, coins, Queen, Dragon) plus giants and quest tiles.

## Giants

Giants are placed on a player's kingdom to **cover crowns**. A covered crown does not count for scoring, effectively reducing a player's score.

**Giant Pool**: 6 giant figurines shared by all players.

### Placing a Giant

After placing a domino that has a **giant symbol**, the player **must** place a giant from the pool onto any crown in their own kingdom.

- The giant covers the crown at the chosen position
- The covered crown no longer contributes to scoring
- If the giant pool is empty, this step is skipped

### Sending a Giant

After placing a domino that has a **footprint symbol**, the player **may** send one of their own giants to an opponent's kingdom.

- Pick a giant from your kingdom (by index)
- Choose an opponent and a crown position on their kingdom
- The giant moves to cover that crown
- This action is optional — use `skipOptionalAction` to skip

## Dominos Per Turn

Age of Giants always draws 5 dominos per turn. Excess dominos are discarded face-down depending on player count:

| Players | Dominos Drawn | Dominos Discarded | Dominos Presented |
|---------|:------------:|:-----------------:|:-----------------:|
| 2       | 5            | 1                 | 4                 |
| 3       | 5            | 2                 | 3                 |
| 4       | 5            | 1                 | 4                 |
| 5       | 5            | 0                 | 5                 |

## Quest Tiles

At game start, 2 quest tiles are drawn from a shuffled pool. These provide **bonus scoring conditions** evaluated at the end of the game for all players.

### Quest Types

| Type | Points | Condition |
|------|:------:|-----------|
| **localTrade** | 5 per tile | Matching terrain tiles adjacent (8-dir) to castle |
| **kingdomBorders** | 5 per tile | Matching terrain tiles in the 4 corners of the kingdom |
| **harmony** | 5 flat | Kingdom is complete (no discarded dominos) |
| **middleKingdom** | 10 flat | Castle is in the center of the kingdom |
| **lostCorner** | 20 flat | Castle is in one of the 4 corners |
| **megalomania** | 10 per alignment | Alignments of 3+ tiles with crowns (H/V/diagonal) |
| **austereKing** | 10 per property | Properties of 5+ tiles (wheat/forest/sea/plain) with 0 crowns |

Quest tiles with `terrain` field (localTrade, kingdomBorders) specify which terrain type to count.

## Turn Flow

### AgeOfGiants Mode

```
placeDomino → [placeGiant if giant symbol] → [sendGiant if footprint symbol] → pickDomino
               (mandatory)                     (optional)
```

### AgeOfGiants-QueenDomino Mode

```
placeDomino → [placeGiant] → [sendGiant] → placeKnight → constructBuilding → useDragon → pickDomino
               (mandatory)    (optional)     (optional)     (optional)          (optional)
```

## API

### New Engine Methods

```typescript
// Place a giant on a crown after placing a giant domino (mandatory)
engine.placeGiant({ game, lordId, position })

// Send a giant to an opponent's kingdom after placing a footprint domino (optional)
engine.sendGiant({ game, lordId, giantIndex, targetPlayerId, targetCrownPosition })

// Skip sending a giant (shared with Queendomino/Origins)
engine.skipOptionalAction({ game, lordId })
```

### New Player Actions

- `placeGiant` — Place giant on a crown in your kingdom (mandatory)
- `sendGiant` — Send a giant to an opponent (optional)

### Game State

```typescript
game.ageOfGiants?: {
  giantPool: number;         // Giants remaining (starts at 6)
  questTiles: QuestTile[];   // 2 quest tiles for this game
}
```

### Player State (AoG fields)

```typescript
player.giants?: PlacedGiant[];  // Giants placed on the kingdom covering crowns
```

## Extra Rules

Age of Giants modes support the same extra rules as Classic:

| Rule | Effect |
|------|--------|
| The middle Kingdom | +10 pts if castle in center |
| Harmony | +5 pts if kingdom complete |
| The Mighty Duel | 7×7 kingdom, 2 players |
| Dynasty | Play 3 games, sum points |
