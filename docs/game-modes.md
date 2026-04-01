# Game Modes

KDomino supports multiple game modes with configurable extra rules, for 1 to 4 players.

---

## Available Modes

| Mode         | Description                                                              |
|--------------|--------------------------------------------------------------------------|
| Classic      | Original Kingdomino rules                                                |
| QueenDomino  | Expansion with buildings, knights, coins, the Queen, and the Dragon      |
| KingdominoOrigins-Discovery | Origins expansion - volcanoes, fire tokens, fire-based scoring |
| KingdominoOrigins-Totem     | Origins - Discovery + resources + totem majority              |
| KingdominoOrigins-Tribe     | Origins - Discovery + resources + cave board + cavemen        |

All modes share the same base rules (player counts, turn structure, kingdom grid). Each mode has its own set of compatible extra rules.

---

## Classic Mode

### Overview

Players take turns picking dominoes from a revealed set and placing them in their kingdom (a 5x5 grid with a castle at the center). Each domino has two terrain tiles, some with crowns. At the end of the game, contiguous groups of the same terrain are scored.

### Scoring

Each contiguous group of identical terrain (a "property") scores:

```
property score = number of tiles in group x number of crowns in group
```

A group with no crowns scores 0 regardless of size. The total score is the sum of all property scores, plus any bonus points from extra rules.

### Turn Flow

During active gameplay, the engine cycles through player actions via `NextAction`:

1. **pickDomino** -- The lord selects a domino from the revealed set. This determines both the domino they will place next turn and the turn order (lower-numbered dominoes go first).
2. **placeDomino** -- The lord places their previously picked domino onto their kingdom grid, respecting adjacency rules (at least one matching terrain edge, must stay within grid bounds).
3. **pass** -- If no valid placement exists, the domino is discarded.

```typescript
import type { PlayerActions } from "@core/domain/types/player.js";

// During gameplay, game.nextAction looks like:
const action: NextAction = {
  type: "action",
  nextLord: "lord-uuid",
  nextAction: "pickDomino" // or "placeDomino" | "pass"
};
```

---

## QueenDomino Mode

QueenDomino extends Classic mode with additional mechanics: buildings, knights, coins, the Queen, and the Dragon. Players have access to extra actions during their turn:

- **placeKnight** -- Place a knight on a just-placed domino tile.
- **constructBuilding** -- Build on a construction square using coins.
- **useDragon** -- Burn an opponent's building tile.
- **skipOptionalAction** -- Skip any of the above optional actions.

For full details, see [queendomino.md](./queendomino.md).

---

## Kingdomino Origins Modes

Origins introduces prehistoric terrains (grassland, lake, jungle, quarry, desert, volcano) and fire-based scoring. Three sub-modes build on each other:

- **Discovery**: Volcanoes provide fire tokens placed on the kingdom. Scoring = region size × fire symbols.
- **Totem**: Discovery + wooden resources + totem majority tiles for bonus points.
- **Tribe**: Discovery + resources + cave board with 22 cavemen to recruit.

Additional actions:
- **placeFireToken** -- Place a fire token after placing a volcano domino.
- **recruitCaveman** -- Recruit a caveman from the cave board (Tribe mode, after picking).
- **skipOptionalAction** -- Skip any of the above optional actions.

For full details, see [origins.md](./origins.md).

---

## Game Rules by Player Count

| Players | Lords/Player | Max Dominoes | Dominoes/Turn | Max Turns | Max Kingdom Size |
|---------|-------------|-------------|---------------|-----------|-----------------|
| 1       | 1           | 48          | 4             | 12        | 5x5             |
| 2       | 2           | 24          | 4             | 6         | 5x5             |
| 3       | 1           | 48          | 4             | 12        | 5x5             |
| 4       | 1           | 48          | 4             | 12        | 5x5             |

With 2 players, each player controls 2 lords and only 24 of the 48 dominoes are used (randomly selected). All other player counts use the full set of 48 dominoes.

These values are defined in `BasicRules`:

```typescript
type BasicRules = {
  lords: number;
  maxDominoes: number;
  dominoesPerTurn: number;
  maxTurns: number;
  maxKingdomSize: number;
};
```

---

## Extra Rules

Extra rules are optional modifiers selected after adding players (during the `options` step). Each rule specifies which modes it's compatible with.

### The Middle Kingdom

> Gain **10 additional points** if your castle is in the center of your kingdom.

The castle tile must be at the exact center of the grid for the bonus to apply. Encourages balanced expansion in all directions.

### Harmony

> Gain **5 additional points** if your kingdom is complete (no discarded dominoes).

Every domino picked must be successfully placed. If the player never has to pass/discard, they earn the bonus.

### The Mighty Duel

> Use all **48 dominoes** and build a **7x7 kingdom**. For 2 players only.

This rule overrides the standard 2-player configuration:
- Uses all 48 dominoes instead of 24
- Expands the kingdom grid from 5x5 to 7x7
- Each player still controls 2 lords

Cannot be enabled if there are more than 2 players (`playersLimit: 2`).

### Dynasty

> Play **3 consecutive games**. The player with the highest total score wins.

A meta-rule that spans multiple games. Individual game scores are summed across all three rounds to determine the overall winner.

---

## Solo Mode

With 1 player, the game uses 1 lord and all 48 dominoes. Each turn, 4 dominoes are revealed; the player picks one and discards the remaining three. The game runs for 12 turns, filling a 5x5 kingdom.

Solo play supports all extra rules except The Mighty Duel (which requires exactly 2 players). The goal is to maximize your score.

---

## Game Flow Diagram

```
createGame(mode)
    |
    v
addPlayers(players)          <-- step: "addPlayers"
    |
    v
addExtraRules(rules)         <-- step: "options" (optional)
    |
    v
startGame()                  <-- step: "start"
    |
    v
+---------------------------+
|       GAME LOOP           |
|                           |
|   pickDomino(lordId,      |
|              dominoId)     |
|        |                  |
|        v                  |
|   placeDomino(lordId,     |
|     dominoId, position,   |
|     rotation)             |
|     -- or --              |
|   pass(lordId, dominoId)  |
|        |                  |
|        v                  |
|   [QueenDomino only]      |
|   placeKnight / construct |
|   Building / useDragon /  |
|   skipOptionalAction      |
|        |                  |
|        v                  |
|   (repeat for each lord   |
|    each turn)             |
+---------------------------+
    |
    v
getResults()                 <-- step: "result"
```

State transitions are tracked by `game.nextAction`, which is either:
- `NextAction` (`type: "action"`) during active gameplay, indicating which lord must act and what action is expected.
- `NextStep` (`type: "step"`) during setup/teardown phases (`addPlayers`, `options`, `start`, `result`).

Use the type guards to distinguish between the two:

```typescript
import { isGameWithNextAction, isGameWithNextStep } from "@core/domain/types/game.js";

if (isGameWithNextAction(game)) {
  // game.nextAction.nextLord -- the lord who must act
  // game.nextAction.nextAction -- "pickDomino" | "placeDomino" | "pass" | ...
}

if (isGameWithNextStep(game)) {
  // game.nextAction.step -- "addPlayers" | "options" | "start" | "result"
}
```
