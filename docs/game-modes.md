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
| AgeOfGiants                 | Age of Giants - giants, quest tiles, 5-player support on Classic |
| AgeOfGiants-QueenDomino     | Age of Giants combined with QueenDomino                       |

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

**Tie-break** (official rule): on equal points, the player with the largest property wins (crowns or not), then the player with the most crowns; players still tied share the position. Age of Giants and Origins (most fire symbols, printed and on fire tokens) use the same order; Queendomino only compares the largest territory. `getResults` reports the deciding criterion in `tiebreaker` and `tied` (see [`FinalResult`](./api-reference.md#finalresult)).

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

- **placeKnight** -- Place a knight on a just-placed domino tile (up to 2 per turn).
- **constructBuilding** -- Build on a construction square using coins.
- **useDragon** -- Burn a building tile of the Builders Board (1 coin).
- **skipOptionalAction** -- Skip any of the above optional actions.

At 2 players, QueenDomino follows the official Queendomino rule: each player builds a **7x7** kingdom with **all 48 dominoes** over 12 turns (see [Game Rules by Player Count](#game-rules-by-player-count)).

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

## Age of Giants Modes

Age of Giants extends Classic Kingdomino (or QueenDomino) with giants, quest tiles, and 5-player support.

**Key differences from Classic:**
- **60 dominos** (48 original + 12 new with giant and footprint symbols)
- **5 dominos per turn** (instead of 4); with fewer than 5 players the dominos at fixed positions of the sorted line are discarded (middle one at 2/4 players, 2nd and 4th at 3 players)
- **Giants** (6 in pool) cover crowns on kingdoms, reducing scores
- **Quest tiles** (2 drawn at game start) provide bonus scoring conditions
- **2-5 players** supported (no solo: `addPlayers` refuses 1 player in Age of Giants modes)

Two sub-modes:
- **AgeOfGiants**: Age of Giants on top of Classic Kingdomino rules.
- **AgeOfGiants-QueenDomino**: Age of Giants combined with QueenDomino (buildings, knights, coins, Queen, Dragon + giants and quests).

Additional actions:
- **placeGiant** — After placing a domino with a giant symbol, place a giant on a crown in your kingdom (mandatory).
- **sendGiant** — After placing a domino with a footprint symbol, send one of your giants to an opponent's kingdom (optional).
- **skipOptionalAction** — Skip sending a giant.

For full details, see [age-of-giants.md](./age-of-giants.md).

---

## Game Rules by Player Count

| Players | Lords/Player | Max Dominoes | Dominoes/Turn | Max Turns | Max Kingdom Size |
|---------|-------------|-------------|---------------|-----------|-----------------|
| 1       | 1           | 48          | 4             | 12        | 5x5             |
| 2       | 2           | 24          | 4             | 6         | 5x5             |
| 3       | 1           | 48          | 4             | 12        | 5x5             |
| 4       | 1           | 48          | 4             | 12        | 5x5             |

With 2 players, each player controls 2 lords and only 24 of the 48 dominoes are used (randomly selected). All other player counts use the full set of 48 dominoes.

**QueenDomino at 2 players** (official Queendomino rule: "Be the player whose 5x5 kingdom (3 to 4 players) or 7x7 kingdom (2 players)…", "All dominoes will be used regardless of the number of players"): 2 lords per player, all **48** dominoes, 4 per turn, **12** turns, **7x7** kingdom. **AgeOfGiants-QueenDomino at 2 players** keeps this setup with the Age of Giants lines: all **60** dominoes, 5 drawn per turn (the middle one discarded), 12 turns, 7x7 kingdom. These mode-specific setups are read from the `modes` section of `src/datasources/rules.json`.

### 3 players

With 3 players the engine follows the current official rule of Kingdomino (2nd edition rulebook, "3 player games"), Queendomino and Kingdomino Origins: all 48 dominoes are used, **4 dominoes are revealed** each turn, each player picks one, and **the leftover (4th) domino is discarded** when the next line is drawn. Over 12 turns, each player receives 12 dominoes.

> The 1st edition of the Kingdomino rulebook used another setup for 3 players (remove 12 random dominoes, play with 36 and reveal 3 per turn). Both lead to 12 dominoes per player; the engine implements the 2nd edition rule, which is also the one of Queendomino and Origins.

Age of Giants has its own table (5 dominos per line, see [age-of-giants.md](./age-of-giants.md)).

These values are defined in `BasicRules`:

```typescript
type BasicRules = {
  lords: number;
  maxDominoes: number;
  dominoesPerTurn: number;
  maxTurns: number;
  maxKingdomSize: number;
  dominoesDiscardedPerTurn?: number; // Age of Giants
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

Every domino the player received must be in their kingdom: the bonus applies when the kingdom holds `lords × maxTurns` dominoes (12 dominoes for a 5x5 kingdom at any player count, solo included; 24 for a 7x7 kingdom with The Mighty Duel or in QueenDomino at 2 players). If the player ever had to pass/discard, the kingdom cannot be complete. The same check is used by "Homo Habilis" (Origins) and the Age of Giants *harmony* quest tile.

### The Mighty Duel

> Use all **48 dominoes** and build a **7x7 kingdom**. For 2 players only.

This rule overrides the standard 2-player configuration:
- Uses all 48 dominoes instead of 24
- Expands the kingdom grid from 5x5 to 7x7
- Each player still controls 2 lords

In **QueenDomino**, the 2-player game already uses this setup (official Queendomino rule): The Mighty Duel is still accepted there for backward compatibility, without any further effect (same setup, same domino order).

Can only be enabled with exactly 2 players (`playersLimit: 2`). "Neolithic", its Kingdomino Origins counterpart, applies the same setup (48 dominoes, 12 turns, 7x7 territory) to the Origins modes, plus the official pair choice: the first pick of each line takes the dominoes 1 and 4 *or* 2 and 3 for that player, the other player gets the two remaining ones (see [Origins Guide](origins.md#neolithic-2-players) and `getValidDominoPicks`).

### Validation

`addExtraRules` refuses a rule that is not available for the game mode or the number of players with a `StepExecutionError` whose code is `EXTRA_RULE_NOT_AVAILABLE` (e.g. The Mighty Duel with 4 players, Harmony in an Origins game). An unknown rule name keeps failing with `STEP_EXECUTION_FAILED`. `getExtraRules` returns the rules available for a mode and player count, or `[]` when none applies.

### Dynasty

> Play **3 consecutive games**. The player with the highest total score wins.

A meta-rule that spans multiple games. Individual game scores are summed across all three rounds to determine the overall winner.

---

## Solo Mode

With 1 player, the game uses 1 lord and all 48 dominoes. Each turn, 4 dominoes are revealed; the player picks one and discards the remaining three. The game runs for 12 turns, filling a 5x5 kingdom.

The official Kingdomino rulebooks have no solo mode: the engine implements the common community variant ("Crown of Thorns" in *Solo Kingdomino* on BoardGameGeek). The player receives 12 dominoes, so Harmony is reachable with a complete kingdom.

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
|   [Origins only]          |
|   placeFireToken /        |
|   recruitCaveman /        |
|   skipOptionalAction      |
|        |                  |
|        v                  |
|   [AoG only]              |
|   placeGiant / sendGiant /|
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
