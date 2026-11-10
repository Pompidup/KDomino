# Age of Giants

Age of Giants is an official expansion that adds giants, quest tiles, and 5-player support to Kingdomino. It can be played on top of Classic Kingdomino or combined with QueenDomino.

## Modes

### AgeOfGiants

The base Age of Giants mode, built on Classic Kingdomino rules.

- **60 dominos**: 48 original + 12 new (with giant and footprint symbols)
- **5 dominos per turn** (excess discarded for fewer players)
- **2-5 players** supported (no solo: `addPlayers` refuses 1 player in Age of Giants modes)
- **6 giant figurines** in the pool
- **2 quest tiles** drawn at game start

### AgeOfGiants-QueenDomino

Age of Giants combined with QueenDomino. Includes all QueenDomino mechanics (buildings, knights, coins, Queen, Dragon), with the same official Queendomino rules (see [queendomino.md](./queendomino.md)), plus giants and quest tiles.

- **2 players: 7x7 kingdom with all 60 dominos.** The Age of Giants rulebook only changes the lines of dominos (5 per line, discards) and adds the giants: selecting and connecting dominos "is done exactly the same way as in both Kingdomino and Queendomino games". The engine therefore keeps the Queendomino 2-player setup (7x7 kingdom, every domino used, 12 turns) with the Age of Giants lines: 60 dominos, 5 drawn per turn, the middle one discarded. At 3-4 players the kingdom is 5x5, as in the AgeOfGiants mode.

## Giants

Giants are placed on a player's kingdom to **cover crowns**. A covered crown does not count for scoring, effectively reducing a player's score.

**Giant Pool**: 6 giant figurines shared by all players.

### Placing a Giant

After placing a domino that has a **giant symbol**, the player **must** place a giant from the pool onto any crown in their own kingdom.

- The giant covers the crown at the chosen position
- The covered crown no longer contributes to scoring
- This action is mandatory: `skipOptionalAction` is refused for `placeGiant`
- If the player has no uncovered crown or the giant pool is empty, the engine does not ask for it (the effect is dismissed, as in the rulebook)

### Sending a Giant

After placing a domino that has a **footprint symbol**, the player **may** send one of their own giants to an opponent's kingdom.

- Pick a giant from your kingdom (by index) and an opponent who has at least one uncovered crown
- **The opponent chooses the crown** the giant covers (official rule: "This opponent is going to have to choose a crown in their kingdom to place the Giant on"):
  - if the opponent has a single uncovered crown, the giant covers it automatically;
  - otherwise the giant leaves your kingdom, `game.ageOfGiants.pendingGiant` is set and `nextAction` becomes `placeGiant` for a lord of the opponent, who calls `placeGiant` with the crown of their choice. The giant does not come from the pool, and your turn then resumes (next optional action in AgeOfGiants-QueenDomino, then `pickDomino`).
- `targetCrownPosition` is still accepted for backward compatibility, but must then be the crown chosen by the opponent (collected by your UI)
- This action is optional — use `skipOptionalAction` to skip

## Dominos Per Turn

Age of Giants always draws 5 dominos per turn. The line is sorted with the letter dominos (A-F, giants) first in alphabetical order, then by number. With fewer than 5 players, dominos are then discarded **at fixed positions of that line**, as shown in the official rulebook ("Setting up lines of dominoes"):

| Players | Dominos Drawn | Discarded positions (sorted line) | Dominos Presented |
|---------|:------------:|:---------------------------------:|:-----------------:|
| 2       | 5            | 3rd (middle)                      | 4 (6 turns, 30 dominos; AgeOfGiants-QueenDomino: 12 turns, 60 dominos, 7x7) |
| 3       | 5            | 2nd and 4th                       | 3                 |
| 4       | 5            | 3rd (middle)                      | 4                 |
| 5       | 5            | none                              | 5                 |

The discard is positional and therefore deterministic: the randomness comes from the (seeded) shuffle of the draw pile. Giant dominos can be revealed at every player count.

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

// Send a giant to an opponent after placing a footprint domino (optional).
// The opponent chooses the crown: omit targetCrownPosition and, if the
// opponent has several free crowns, they answer with placeGiant.
engine.sendGiant({ game, lordId, giantIndex, targetPlayerId })

// Skip sending a giant (shared with Queendomino/Origins)
engine.skipOptionalAction({ game, lordId })
```

### New Player Actions

- `placeGiant` — Place giant on a crown in your kingdom (mandatory; also used by the targeted opponent to place a sent giant)
- `sendGiant` — Send a giant to an opponent (optional)

### Game State

```typescript
game.ageOfGiants?: {
  giantPool: number;         // Giants remaining (starts at 6)
  questTiles: QuestTile[];   // 2 quest tiles for this game
  pendingGiant?: {           // Sent giant waiting for the opponent's choice
    fromLordId: string;
    targetPlayerId: string;
  };
}
```

### Player State (AoG fields)

```typescript
player.giants?: PlacedGiant[];  // Giants placed on the kingdom covering crowns
```

## Extra Rules

Age of Giants modes (`AgeOfGiants` and `AgeOfGiants-QueenDomino`) support a **single** optional rule (see `src/datasources/rules.json`, `getExtraRules`):

| Rule | Effect |
|------|--------|
| Dynasty | Play 3 games in a row; the player with the highest total points wins (see `getDynastyResults`) |

The middle Kingdom, Harmony and The Mighty Duel are **not** optional rules of Age of Giants modes: `getExtraRules` does not return them for `AgeOfGiants` / `AgeOfGiants-QueenDomino`. The middle Kingdom and Harmony bonuses can still apply through the quest tiles of the same name (`middleKingdom`, `harmony`, see [Quest Types](#quest-types)).
