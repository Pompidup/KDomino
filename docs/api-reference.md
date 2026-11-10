# API Reference

Complete API reference for `@pompidup/kingdomino-engine`.

---

## Table of Contents

1. [Engine Configuration](#engine-configuration)
2. [Core Methods](#core-methods)
3. [Command Types](#command-types)
4. [Game State Types](#game-state-types)
5. [Domain Types](#domain-types)
6. [Queendomino Types](#queendomino-types)
7. [Origins Types](#origins-types)
8. [Age of Giants Types](#age-of-giants-types)
9. [Error Codes](#error-codes)
10. [Utilities](#utilities)
11. [Type Guards](#type-guards)
12. [Valid targets for extension actions](#valid-targets-for-extension-actions)
13. [Score Breakdown](#score-breakdown)

---

## Engine Configuration

Create an engine instance with `createGameEngine(config)`. All configuration fields are optional.

```typescript
import { createGameEngine } from '@pompidup/kingdomino-engine';

const engine = createGameEngine({
  logging: true,
  events: { onGameEnd: ({ game }) => console.log('Game over') },
});
```

### `EngineConfig`

```typescript
type EngineConfig = {
  uuidMethod?: UuidMethod;
  shuffleMethod?: ShuffleMethod;
  logging?: boolean;
  logger?: Logger;
  events?: GameEventCallbacks;
  translator?: Translator;
  debug?: boolean | DebugOptions;
};
```

| Field | Type | Default | Description |
|---|---|---|---|
| `uuidMethod` | `UuidMethod` | `crypto.randomUUID()` | Custom UUID generation function. |
| `shuffleMethod` | `ShuffleMethod` | Fisher-Yates | Custom array shuffle function. |
| `logging` | `boolean` | `false` | Enable built-in console logging. |
| `logger` | `Logger` | Silent logger | Custom logger instance. When provided, takes precedence over `logging`. |
| `events` | `GameEventCallbacks` | `undefined` | Event callbacks for UI/animation integration. See [Game Events](#game-events). |
| `translator` | `Translator` | English | Custom translator for i18n error messages. |
| `debug` | `boolean \| DebugOptions` | `undefined` | Enable debug mode. Pass `true` for defaults or a `DebugOptions` object. See [Debug Mode](#debug-mode). |

---

## Core Methods

All methods are available on the `GameEngine` object returned by `createGameEngine()`.

### Setup Methods

| Method | Command Type | Return Type | Description |
|---|---|---|---|
| `getModes` | `GetModesCommand` | `GameMode[]` | Retrieve all available game modes. |
| `getExtraRules` | `GetExtraRulesCommand` | `ExtraRule[]` | Get available extra rules for a mode and player count (`[]` when none applies). |
| `createGame` | `CreateGameCommand` | `GameWithNextStep` | Create a new game instance with the specified mode. |
| `addPlayers` | `AddPlayersCommand` | `GameWithNextStep` | Add players (human or bot) and initialize their kingdoms. |
| `addExtraRules` | `AddExtraRulesCommand` | `GameWithNextStep` | Add optional extra rules to modify gameplay. Each rule must be available for the game mode and player count (see `getExtraRules`). |
| `startGame` | `StartGameCommand` | `GameWithNextAction` | Start the game, shuffle dominoes, reveal the first set. |

### Gameplay Methods

| Method | Command Type | Return Type | Description |
|---|---|---|---|
| `chooseDomino` | `ChooseDominoCommand` | `GameWithNextAction` | A lord picks a domino from the revealed set (Origins "Neolithic": the first pick of a line chooses the pair 1 & 4 or 2 & 3, see [Neolithic pair choice](#neolithic-pair-choice)). |
| `placeDomino` | `PlaceDominoCommand` | `GameState` | Place a domino on the lord's kingdom at the given position and rotation. |
| `discardDomino` | `DiscardDominoCommand` | `GameState` | Discard a domino when no valid placement exists. |

### Queendomino Methods

| Method | Command Type | Return Type | Description |
|---|---|---|---|
| `placeKnight` | `PlaceKnightCommand` | `GameState` | Place a knight on one of the squares of the domino the lord has just placed (`queendomino.lastPlacedPositions`). |
| `constructBuilding` | `ConstructBuildingCommand` | `GameState` | Construct a building on a construction square in the lord's kingdom. |
| `useDragon` | `UseDragonCommand` | `GameState` | Use the dragon to destroy a building tile on the builders board. |
| `skipOptionalAction` | `SkipOptionalActionCommand` | `GameState` | Skip the current optional action (knight, building, or dragon). |

### Origins Methods

| Method | Command Type | Return Type | Description |
|---|---|---|---|
| `placeFireToken` | `PlaceFireTokenCommand` | `GameState` | Place a fire token on the kingdom after placing a volcano domino. |
| `recruitCaveman` | `RecruitCavemanCommand` | `GameState` | Recruit a caveman from the cave board (Tribe mode only). |

### Age of Giants Methods

| Method | Command Type | Return Type | Description |
|---|---|---|---|
| `placeGiant` | `PlaceGiantCommand` | `GameState` | Place a giant on a crown in the lord's kingdom (after a giant domino, or when an opponent sent you a giant). Mandatory: cannot be skipped. |
| `sendGiant` | `SendGiantCommand` | `GameState` | Send a giant from the lord's kingdom to an opponent, who chooses the crown it covers. |

### Scoring and Results

| Method | Command Type | Return Type | Description |
|---|---|---|---|
| `getResults` | `GetResultCommand` | `GameWithResults` | Calculate final results after the game ends. |
| `calculateScore` | `CalculateScoreCommand` | `Score` | Calculate the score for a single kingdom (live scoring). |
| `getDynastyResults` | `GetDynastyResultCommand` | `DynastyResult[]` | Aggregate results from multiple completed games. |
| `calculatePlayerScore` | `CalculatePlayerScoreCommand` | `PlayerScore` | Mode-aware score of one player with its breakdown, live during the game and final once it is over. See [Score Breakdown](#score-breakdown). |

### Query Methods

| Method | Command Type | Return Type | Description |
|---|---|---|---|
| `getValidPlacements` | `GetValidPlacementsCommand` | `ValidPlacement[]` | Find all valid placements for a domino on a kingdom. |
| `canPlaceDomino` | `CanPlaceDominoCommand` | `boolean` | Check if a domino can be placed anywhere on a kingdom. |
| `getValidDominoPicks` | `GetValidDominoPicksCommand` | `number[]` | Numbers of the revealed dominoes `chooseDomino` accepts for the lord (default: the lord to play): not picked and, with Neolithic, not reserved for the other player. `[]` when the game does not wait for this lord to pick. |

### Serialization Methods

| Method | Command Type | Return Type | Description |
|---|---|---|---|
| `serialize` | `SerializeGameCommand` | `string` | Serialize game state to a JSON string. |
| `deserialize` | `DeserializeGameCommand` | `GameState` | Restore game state from a JSON string. |

---

## Command Types

### `GetModesCommand`

```typescript
type GetModesCommand = Record<string, never>; // empty object {}
```

### `GetExtraRulesCommand`

```typescript
type GetExtraRulesCommand = {
  mode: string;     // Game mode name (e.g., "Classic")
  players: number;  // Number of players
};
```

### `CreateGameCommand`

```typescript
type CreateGameCommand = {
  mode: string;   // Game mode name
  seed?: string;  // Optional seed for deterministic shuffle (replays, sharing)
};
```

### `AddPlayersCommand`

```typescript
type PlayerInput =
  | string
  | { id?: string; name: string; bot?: { strategyName: string } };

type AddPlayersCommand = {
  game: GameState;
  players: PlayerInput[];  // 1-4 players; strings for humans, objects for bots or stable ids
};
```

### `AddExtraRulesCommand`

```typescript
type AddExtraRulesCommand = {
  game: GameState;
  extraRules: string[];  // Rule names (e.g., ["The middle Kingdom", "Harmony"])
};
```

Throws a `StepExecutionError` with code `EXTRA_RULE_NOT_AVAILABLE` when a rule
exists but not for the game mode or the number of players (e.g. "The Mighty
Duel" with 4 players, "Harmony" in an Origins or Age of Giants game), and with
code `STEP_EXECUTION_FAILED` for an unknown rule name.

### `StartGameCommand`

```typescript
type StartGameCommand = {
  game: GameState;
};
```

### `ChooseDominoCommand`

```typescript
type ChooseDominoCommand = {
  game: GameState;
  dominoPick: number;  // Domino number to pick
  lordId: string;      // ID of the lord picking
};
```

#### Neolithic pair choice

With the Kingdomino Origins "Neolithic" rule (2 players), the official rulebook says that each turn the first player "chooses to take dominos 1 and 4 OR 2 and 3 (in the column, from the top). The other player takes the 2 remaining dominoes." The engine keeps the usual `chooseDomino` flow:

- the **first pick of each line** of 4 dominoes chooses the pair: picking the domino at `position` 1 or 4 takes the pair 1 & 4, position 2 or 3 the pair 2 & 3;
- the whole line is then reserved (`RevealsDomino.reservedFor`): the pair for the picking lord's player, the two other dominoes for the opponent;
- every lord then picks, in the usual order, one domino reserved for its player; picking a domino reserved for the other player fails with `DOMINO_RESERVED`.

`getValidDominoPicks({ game })` lists the dominoes the lord to play may pick, and the `onNeolithicPairChosen` event reports the pair choice. The action log records the picks as usual (`chooseDomino`), so a replay reproduces the reservations.

```typescript
const picks = engine.getValidDominoPicks({ game }); // e.g. [12, 31] after the pair choice
game = engine.chooseDomino({ game, lordId: game.nextAction.nextLord, dominoPick: picks[0] });
```

### `GetValidDominoPicksCommand`

```typescript
type GetValidDominoPicksCommand = {
  game: GameState;   // any state is accepted
  lordId?: string;   // default: the lord to play (game.nextAction.nextLord)
};
```

### `PlaceDominoCommand`

```typescript
type PlaceDominoCommand = {
  game: GameState;
  lordId: string;
  position: Position;    // { x, y } on the kingdom grid
  rotation: Rotation;    // 0 | 90 | 180 | 270
};
```

### `DiscardDominoCommand`

```typescript
type DiscardDominoCommand = {
  game: GameState;
  lordId: string;
};
```

### `GetResultCommand`

```typescript
type GetResultCommand = {
  game: GameState;
};
```

### `CalculateScoreCommand`

```typescript
type CalculateScoreCommand = {
  kingdom: Kingdom;
};
```

### `GetValidPlacementsCommand`

```typescript
type GetValidPlacementsCommand = {
  kingdom: Kingdom;
  domino: Domino;
  maxKingdomSize?: number;  // Default: 5, use 7 for Mighty Duel
};
```

### `CanPlaceDominoCommand`

```typescript
type CanPlaceDominoCommand = {
  kingdom: Kingdom;
  domino: Domino;
  maxKingdomSize?: number;  // Default: 5, use 7 for Mighty Duel
};
```

### `SerializeGameCommand`

```typescript
type SerializeGameCommand = {
  game: GameState;
};
```

### `DeserializeGameCommand`

```typescript
type DeserializeGameCommand = {
  json: string;
};
```

### `GetDynastyResultCommand`

```typescript
type DynastyGroupBy = "playerId" | "playerName";

type GetDynastyResultCommand = {
  games: GameWithResults[];
  groupBy?: DynastyGroupBy;  // defaults to "playerId"
};
```

### `PlaceKnightCommand`

```typescript
type PlaceKnightCommand = {
  game: GameWithNextAction;
  lordId: string;
  position: Position;
};
```

### `ConstructBuildingCommand`

```typescript
type ConstructBuildingCommand = {
  game: GameWithNextAction;
  lordId: string;
  buildingId: number;
  position: Position;
};
```

### `UseDragonCommand`

```typescript
type UseDragonCommand = {
  game: GameWithNextAction;
  lordId: string;
  buildingId: number;
};
```

### `SkipOptionalActionCommand`

```typescript
type SkipOptionalActionCommand = {
  game: GameWithNextAction;
  lordId: string;
};
```

### `PlaceFireTokenCommand`

```typescript
type PlaceFireTokenCommand = {
  game: GameWithNextAction;
  lordId: string;
  position: Position;
};
```

### `RecruitCavemanCommand`

```typescript
type RecruitCavemanCommand = {
  game: GameWithNextAction;
  lordId: string;
  cavemanId: number;         // ID of the caveman tile to recruit
  position: Position;         // Position on the kingdom to place the caveman
  resourcePositions: Position[]; // Positions of resources to spend as payment
};
```

### `PlaceGiantCommand`

```typescript
type PlaceGiantCommand = {
  game: GameWithNextAction;
  lordId: string;
  position: Position;
};
```

When `game.ageOfGiants.pendingGiant` is set, `placeGiant` is played by a lord of
the targeted player to choose which of their crowns the sent giant covers. That
giant does not come from the pool, and the sender's turn resumes afterwards.

### `SendGiantCommand`

```typescript
type SendGiantCommand = {
  game: GameWithNextAction;
  lordId: string;
  giantIndex: number;            // Index of the giant to send from the player's giants array
  targetPlayerId: string;        // ID of the opponent to receive the giant
  targetCrownPosition?: Position; // Crown chosen BY THE OPPONENT (optional, see below)
};
```

Per the official rules, the targeted opponent chooses the crown:

- Omit `targetCrownPosition` (recommended). If the opponent has a single free
  crown, the giant covers it immediately. If they have several, the giant is
  removed from the sender, `game.ageOfGiants.pendingGiant` is set and
  `nextAction` becomes `placeGiant` for a lord of the opponent, who calls
  `placeGiant` with the crown of their choice.
- `targetCrownPosition` is still accepted for backward compatibility; pass it
  only when your client already collected the opponent's choice.
- An opponent without a free crown cannot be targeted (`INVALID_GIANT_PLACEMENT`).

---

## Game State Types

### `Game`

The core aggregate containing all game data.

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
  seed?: string;
  queendomino?: QueenDominoState;   // Only present in QueenDomino modes
  origins?: OriginsState;           // Only present in KingdominoOrigins modes
  ageOfGiants?: AgeOfGiantsState;   // Only present in AgeOfGiants modes
};
```

### `NextAction`

Represents a player action that must be performed during active gameplay.

```typescript
type NextAction = {
  type: "action";
  nextLord: string;        // ID of the lord who must act
  nextAction: PlayerActions; // The action to perform
};
```

### `NextStep`

Represents a game phase transition (setup or end).

```typescript
type NextStep = {
  type: "step";
  step: GameSteps;  // "addPlayers" | "options" | "start" | "result"
};
```

### `GameSteps`

```typescript
const gameSteps = {
  addPlayers: "addPlayers",
  options: "options",
  start: "start",
  result: "result",
} as const;

type GameSteps = "addPlayers" | "options" | "start" | "result";
```

### Narrowed State Types

```typescript
type GameWithNextAction = Game & { nextAction: NextAction };
type GameWithNextStep   = Game & { nextAction: NextStep };
type GameState          = GameWithNextAction | GameWithNextStep;
type GameWithResults    = Game & { result: FinalResult[] };
```

### `Score`

```typescript
type Score = {
  points: number;            // Total points earned
  maxPropertiesSize: number; // Size of the largest contiguous property
  totalCrowns: number;       // Total number of crowns in the kingdom
};
```

### `ScoreResult`

```typescript
type ScoreResult = {
  playerId: string;
  playerName: string;
  details: Score;
  breakdown?: ScoreBreakdown; // Always set by getResults (see Score Breakdown)
};
```

### `FinalResult`

```typescript
type FinalResult = ScoreResult & {
  position: number;  // Final ranking (1 = winner)
};
```

### `DynastyResult`

```typescript
type DynastyResult = {
  playerId: string;
  playerName: string;
  totalPoints: number;
  gamesPoints: number[];
  position: number;
};
```

### `ValidPlacement`

```typescript
type ValidPlacement = {
  position: Position;
  rotation: Rotation;
};
```

---

## Domain Types

### `Tile`

```typescript
type Tile = {
  type: Ground;     // Terrain type
  crowns: Crown;    // Number of crowns (0-3)
  hasConstructionSquare?: boolean; // Queendomino only
};
```

### `EmptyTile`

```typescript
type EmptyTile = {
  type: "empty";
  crowns: 0;
};
```

### `Ground`

```typescript
type Ground =
  // Classic / Queendomino / Age of Giants
  | "castle" | "wheat" | "forest" | "sea" | "plain" | "swamp" | "mine"
  // Kingdomino Origins
  | "grassland" | "lake" | "jungle" | "quarry" | "desert" | "volcano";
```

The runtime list is exported as `GROUND`.

### `Crown`

```typescript
type Crown = number; // 0-3
```

### `Domino`

```typescript
type Domino = {
  left: Tile;      // Left tile of the domino
  right: Tile;     // Right tile of the domino
  number: number;  // Unique identifier (1-48 in Classic)
};
```

### `RevealsDomino`

```typescript
type RevealsDomino = {
  domino: Domino;
  picked: boolean;
  lordId: string | null;
  position: number;       // Display position in the revealed set (1 = lowest number)
  reservedFor?: string;   // Neolithic: id of the player who may pick it
};
```

### `Kingdom`

A 9x9 grid of tiles. The playable area is 5x5 (or 7x7 for Mighty Duel) with the castle at the center.

```typescript
type Kingdom = (Tile | EmptyTile)[][];

const GRIDSIZE = 9;
const MAX_KINGDOM_SIZE = 5;
```

### `Position`

```typescript
type Position = {
  x: number;  // Column (0-8, left to right)
  y: number;  // Row (0-8, top to bottom)
};
```

### `Rotation`

```typescript
type Rotation = 0 | 90 | 180 | 270;
```

| Value | Orientation |
|---|---|
| `0` | Horizontal -- left tile at position, right tile to the east |
| `90` | Vertical -- left tile at position, right tile to the south |
| `180` | Horizontal -- right tile at position, left tile to the east |
| `270` | Vertical -- right tile at position, left tile to the south |

### `Player`

```typescript
type Player = {
  id: string;
  name: string;
  kingdom: Kingdom;
  bot?: { strategyName: string };
  coins?: number;               // Queendomino
  towers?: number;              // Queendomino
  knights?: Knight[];           // Queendomino
  bonusKnights?: number;        // Queendomino (extra knights from building bonuses)
  buildings?: PlacedBuilding[]; // Queendomino
  fireTokens?: PlacedFireToken[];  // Origins
  resources?: Resource[];          // Origins Totem/Tribe
  cavemen?: PlacedCaveman[];       // Origins Tribe
  giants?: PlacedGiant[];          // Age of Giants
};
```

### `PlayerInput`

Used when adding players. A plain string creates a human player; an object can specify a bot strategy and/or a stable `id` (non-empty, unique within the call — otherwise `INVALID_PLAYER_ID`). Without `id`, the engine generates one with `uuidMethod`.

```typescript
type PlayerInput =
  | string
  | { id?: string; name: string; bot?: { strategyName: string } };
```

### `PlayerActions`

```typescript
type PlayerActions =
  | "placeDomino"
  | "pickDomino"
  | "pass"
  | "placeKnight"         // Queendomino, optional
  | "constructBuilding"   // Queendomino, optional
  | "useDragon"           // Queendomino, optional
  | "skipOptionalAction"  // Queendomino / Origins / AoG
  | "placeGiant"          // Age of Giants, mandatory
  | "sendGiant"           // Age of Giants, optional
  | "placeFireToken"      // Origins, optional
  | "recruitCaveman";     // Origins Tribe, optional
```

### `Lord`

```typescript
type Lord = {
  id: string;
  playerId: string;
  turnEnded: boolean;
  hasPick: boolean;
  hasPlace: boolean;
  dominoPicked?: Domino;
};
```

### `GameMode`

```typescript
type GameMode = {
  name: string;
  description: string;
};
```

### `ExtraRule`

```typescript
type ExtraRule = {
  name: string;
  description: string;
  mode: GameMode[];
  playersLimit?: number;
};
```

### `BasicRules`

```typescript
type BasicRules = {
  lords: number;
  maxDominoes: number;
  dominoesPerTurn: number;
  maxTurns: number;
  maxKingdomSize: number;
};
```

### `SelectedRules`

```typescript
type SelectedRules = {
  basic: BasicRules;
  extra: ExtraRule[];
};
```

---

## Queendomino Types

These types are only relevant when playing in QueenDomino mode. The `queendomino` field on `Game` is `undefined` in Classic mode.

### `QueenDominoState`

```typescript
type QueenDominoState = {
  buildersBoard: BuildersBoard;
  queenHolderId: string | null;
  dragonAvailable: boolean;
  dragonUsedThisRound: boolean;     // reset to false at each new round
  lastPlacedPositions?: Position[]; // squares of the domino just placed
};
```

### `BuildersBoard`

```typescript
type BuildersBoard = {
  slots: BuildingSlot[];       // 4 visible slots, each holds a building or null
  drawPile: BuildingTile[];    // Remaining building tiles
};

type BuildingSlot = BuildingTile | null;
```

### `BuildingTile`

```typescript
type BuildingTile = {
  id: number;
  name: string;
  cost: number;                      // Cost in coins
  immediateBonus?: ImmediateBonus;   // Bonus granted on construction
  crowns: number;                    // Permanent crowns added
  towers: number;                    // Towers granted
  endGameScoring?: EndGameScoring;   // End-game scoring condition
};
```

### `ImmediateBonus`

```typescript
type ImmediateBonusType = "coins" | "tower" | "knight";

type ImmediateBonus = {
  type: ImmediateBonusType;
  amount: number;
};
```

### `EndGameScoring`

```typescript
type EndGameScoringType =
  | "perTerrain"   // Points per tile of a specific terrain type
  | "perBuilding"  // Points per building in the kingdom
  | "perTower"     // Points per tower owned
  | "perCrown"     // Points per crown in the kingdom
  | "flat";        // Flat bonus points

type EndGameScoring = {
  type: EndGameScoringType;
  terrain?: string;   // Only for "perTerrain"
  points: number;     // Points per matching element
};
```

### `Knight`

```typescript
type Knight = {
  playerId: string;
  position: Position;
};
```

### `PlacedBuilding`

```typescript
type PlacedBuilding = {
  building: BuildingTile;
  position: Position;
};
```

---

## Origins Types

These types are only relevant when playing in Origins modes. The `origins` field on `Game` is `undefined` in non-Origins modes.

### `OriginsState`

```typescript
type OriginsState = {
  subMode: OriginsSubMode;           // "Discovery" | "Totem" | "Tribe"
  fireTokenPool: FireTokenPool;
  pendingFireToken?: PendingFireToken;
  totems?: TotemState;               // Totem mode only
  caveBoard?: CaveBoard;            // Tribe mode only
};
```

### `FireTokenPool`

```typescript
type FireTokenPool = {
  ones: number;    // 1-fire tokens remaining
  twos: number;    // 2-fire tokens remaining
  threes: number;  // 3-fire tokens remaining
};
```

### `PlacedFireToken`

```typescript
type PlacedFireToken = {
  fires: 1 | 2 | 3;
  position: Position;
};
```

### `PendingFireToken`

```typescript
type PendingFireToken = {
  fires: 1 | 2 | 3;
  volcanoPosition: Position;
};
```

### `Resource`

```typescript
type ResourceType = "mammoth" | "fish" | "mushroom" | "flint";

type Resource = {
  type: ResourceType;
  position: Position;
};
```

### `TotemState`

```typescript
type TotemState = Record<ResourceType, string | null>;  // maps resource type to holder player ID
```

### `CaveBoard`

```typescript
type CaveBoard = {
  visible: CavemanTile[];   // Up to 4 visible caveman tiles
  drawPile: CavemanTile[];  // Face-down draw pile
};
```

### `CavemanTile`

```typescript
type CavemanTile = HunterGathererTile | WarriorTile;

type HunterGathererTile = {
  kind: "hunterGatherer";
  id: number;
  hunterType: HunterGathererKind;
  pointsPerMatch: number;
};

type WarriorTile = {
  kind: "warrior";
  id: number;
  warriorType: WarriorType;  // "small" | "amazon" | "oafish"
  power: number;             // 1, 2, or 3
};

// Discriminant values of CavemanTile["kind"]
const cavemanKinds = { hunterGatherer: "hunterGatherer", warrior: "warrior" } as const;
type CavemanKind = "hunterGatherer" | "warrior";
```

Narrow a `CavemanTile` with `kind` or with the [`isHunterGathererTile` / `isWarriorTile`](#ishuntergatherertile--iswarriortile) type guards.

### `PlacedCaveman`

```typescript
type PlacedCaveman = {
  caveman: CavemanTile;
  position: Position;
};
```

---

## Age of Giants Types

These types are only relevant when playing in Age of Giants modes. The `ageOfGiants` field on `Game` is `undefined` in non-AoG modes.

### `AgeOfGiantsState`

```typescript
type AgeOfGiantsState = {
  giantPool: number;         // Giant figurines remaining (starts at 6)
  questTiles: QuestTile[];   // 2 quest tiles drawn for this game
  pendingGiant?: PendingGiant; // Sent giant waiting for the opponent's crown choice
};
```

### `PendingGiant`

```typescript
type PendingGiant = {
  fromLordId: string;      // Lord who sent the giant (their turn resumes afterwards)
  targetPlayerId: string;  // Player who must choose the crown with placeGiant
};
```

### `PlacedGiant`

```typescript
type PlacedGiant = {
  position: Position;  // Position on the kingdom covering a crown
};
```

### `QuestTile`

```typescript
type QuestTile = {
  id: number;
  type: QuestType;
  name: string;
  description: string;
  points: number;      // Points per match
  terrain?: Ground;    // Only for localTrade and kingdomBorders quests
};
```

### `QuestType`

```typescript
type QuestType =
  | "localTrade"       // 5pts per matching terrain tile adjacent to castle
  | "kingdomBorders"   // 5pts per matching terrain tile in kingdom corners
  | "harmony"          // 5pts if kingdom is complete
  | "middleKingdom"    // 10pts if castle is centered
  | "lostCorner"       // 20pts if castle is in a corner
  | "megalomania"      // 10pts per alignment of 3+ crowned tiles
  | "austereKing";     // 10pts per property of 5+ tiles with 0 crowns
```

---

## Error Codes

All errors thrown by the engine are instances of `DomainException` (or a subclass) and carry a `code` field from the `ErrorCode` enum.

```typescript
import { DomainException, ErrorCode } from '@pompidup/kingdomino-engine';

try {
  engine.placeDomino(command);
} catch (error) {
  if (error instanceof DomainException) {
    switch (error.code) {
      case ErrorCode.INVALID_PLACEMENT:
        // handle invalid placement
        break;
    }
  }
}
```

### Game Flow Errors

| Code | Description |
|---|---|
| `INVALID_STEP` | The game is in an invalid step for the requested action. |
| `STEP_EXECUTION_FAILED` | A step execution (setup phase) failed. |
| `ACTION_EXECUTION_FAILED` | An action execution (gameplay phase) failed. |

### Entity Not Found Errors

| Code | Description |
|---|---|
| `LORD_NOT_FOUND` | The specified lord ID does not exist. |
| `PLAYER_NOT_FOUND` | The specified player ID does not exist. |
| `DOMINO_NOT_FOUND` | The specified domino number does not exist in the current set. |
| `MODE_NOT_FOUND` | The specified game mode does not exist. |

### Validation Errors

| Code | Description |
|---|---|
| `INVALID_PLAYER_COUNT` | Player count is outside the valid range (1-4). |
| `INVALID_PLAYER_NAME` | Player name is too short (minimum 3 characters). |
| `EXTRA_RULE_NOT_AVAILABLE` | The extra rule is not available for this game mode or number of players. |
| `INVALID_PLACEMENT` | General invalid domino placement. |
| `PLACEMENT_NOT_EMPTY` | One or both target cells are already occupied. |
| `PLACEMENT_NOT_ADJACENT` | The domino is not adjacent to any existing tile. |
| `PLACEMENT_INVALID_TERRAIN` | Neither tile matches the terrain of any adjacent tile. |
| `PLACEMENT_OUT_OF_BOUNDS` | The placement falls outside the grid boundaries. |
| `PLACEMENT_EXCEEDS_KINGDOM_SIZE` | The placement would exceed the maximum kingdom size (5x5 or 7x7). |

### Action Errors

| Code | Description |
|---|---|
| `NOT_YOUR_TURN` | The specified lord is not the one who should act next. |
| `CANNOT_PICK` | The lord cannot pick a domino at this time. |
| `CANNOT_PLACE` | The lord cannot place a domino at this time. |
| `DOMINO_ALREADY_PICKED` | The selected domino has already been picked by another lord. |
| `DOMINO_RESERVED` | Neolithic (Origins): the selected domino is reserved for the other player (pairs 1 & 4 and 2 & 3). |

### History Errors

| Code | Description |
|---|---|
| `UNDO_UNAVAILABLE` | No previous state to undo to. |
| `REDO_UNAVAILABLE` | No future state to redo to. |

### Queendomino Errors

| Code | Description |
|---|---|
| `CANNOT_PLACE_KNIGHT` | Knight placement is not allowed at this time. |
| `MAX_KNIGHTS_REACHED` | The player has reached the maximum number of knights. |
| `KNIGHT_TERRITORY_OCCUPIED` | The target territory already has a knight. |
| `CANNOT_AFFORD_BUILDING` | The player does not have enough coins for the building. |
| `NO_CONSTRUCTION_SQUARE` | No construction square is available at the target position. |
| `DRAGON_UNAVAILABLE` | The dragon is not available (already used this round or not unlocked). |
| `QUEEN_HOLDER_CANNOT_USE_DRAGON` | The player holding the Queen cannot use the dragon. |
| `BUILDING_NOT_FOUND` | The specified building ID does not exist on the builders board. |
| `INVALID_OPTIONAL_ACTION` | The current optional action does not match the requested action. |

### Age of Giants Errors

| Code | Description |
|---|---|
| `GIANT_POOL_EMPTY` | No giant figurines remaining in the pool. |
| `GIANT_NOT_FOUND` | The specified giant index does not exist on the player's kingdom. |
| `INVALID_GIANT_PLACEMENT` | The target position does not have an uncovered crown. |
| `NOT_AOG_MODE` | The current game mode does not support Age of Giants actions. |

### Origins Errors

| Code | Description |
|---|---|
| `FIRE_TOKEN_POOL_EMPTY` | No fire tokens of the required type remaining. |
| `FIRE_TOKEN_INVALID_POSITION` | The target position is not valid for fire token placement. |
| `NO_PENDING_FIRE_TOKEN` | No fire token is pending placement (no volcano was placed). |
| `CANNOT_RECRUIT_CAVEMAN` | Caveman recruitment is not allowed at this time. |
| `INSUFFICIENT_RESOURCES` | The player does not have enough resources to recruit. |
| `INVALID_CAVEMAN_PLACEMENT` | The target position is not valid for caveman placement. |
| `CAVEMAN_NOT_FOUND` | The specified caveman ID does not exist on the cave board. |
| `NOT_TRIBE_MODE` | Caveman recruitment is only available in Tribe mode. |

### Player Id Errors

| Code | Description |
|---|---|
| `INVALID_PLAYER_ID` | A player id passed to `addPlayers` is empty or duplicated. |

### Exception Classes

| Class | Base Code | Usage |
|---|---|---|
| `DomainException` | (varies) | Base class for all domain errors. |
| `InvalidStepError` | `INVALID_STEP` | Game is in wrong phase for the operation. |
| `StepExecutionError` | `STEP_EXECUTION_FAILED` | Setup phase operation failed. |
| `ActionExecutionError` | `ACTION_EXECUTION_FAILED` | Gameplay action failed. |
| `NotFoundError` | `LORD_NOT_FOUND` | Required entity not found. |
| `ValidationError` | (varies) | Input validation failed. |
| `UndoError` | `UNDO_UNAVAILABLE` | No state available to undo. |
| `RedoError` | `REDO_UNAVAILABLE` | No state available to redo. |

All exception classes expose `code: ErrorCodeType`, `message: string`, and optional `context: Record<string, unknown>`.

---

## Utilities

### Bot Strategies

Play automated turns with built-in bot strategies. Bots can be mixed with human players.

```typescript
import {
  randomStrategy,
  greedyStrategy,
  advancedStrategy,
  expertStrategy,
  isBotTurn,
  playBotTurn,
  playBotTurns,
  getStrategy,
  getStrategyNames,
} from '@pompidup/kingdomino-engine';
```

| Export | Description |
|---|---|
| `randomStrategy` | Seeded random choices: random domino, random placement, random valid target (or skip) for every extension action. |
| `greedyStrategy` | Maximizes the immediate mode-aware score, for dominoes and extension actions. |
| `advancedStrategy` | 1-turn look-ahead on dominoes; extension actions weigh the best opponent's score at ½. |
| `expertStrategy` | Beam search over the next turns on dominoes; extension actions maximize the lead over the best opponent. |
| `isBotTurn(game)` | Returns `true` if the current lord belongs to a bot player. |
| `playBotTurn(engine, game, strategy)` | Plays a single bot action (pick, placement, extension action), returns updated game state. |
| `playBotTurns(engine, game, customStrategies?)` | Plays all consecutive bot turns until a human must act. |
| `getStrategy(name)` | Look up a strategy by name from the registry. |
| `getStrategyNames()` | Returns all registered strategy names. |

`PickContext.availableDominoes` only holds the dominoes `chooseDomino` accepts for the lord (the same list as `getValidDominoPicks`): with Origins "Neolithic", the dominoes reserved for the other player are left out, and the bot's first pick of a line chooses the pair.

**Types:** `BotStrategy`, `BotExtensionChoices`, `PickContext`, `PlaceContext`, `ExtensionContext`, `KnightContext`, `BuildingContext`, `BuildingChoice`, `DragonContext`, `FireTokenContext`, `CavemanContext`, `CavemanChoice`, `GiantPositionContext`, `SendGiantContext`, `SendGiantChoice`, `StrategyName`.

#### Mode-aware evaluation

The built-in bots (except `randomStrategy`) evaluate every decision with the **mode-aware live score** of the player (the score of `calculatePlayerScore`: territories plus every bonus of the mode — Queen, buildings, fire tokens, resources and totems, cavemen, quests, Middle Kingdom / Empire of Fire —, provisional bonuses included), plus a small value for the assets the score does not count yet:

| Asset | Value per unit | Mode |
|---|---|---|
| Coin | 0.5 point | Queendomino, Age of Giants + Queendomino |
| Knight not placed yet | 0.75 point | Queendomino, Age of Giants + Queendomino |
| Resource | 0.5 point | Origins Tribe (resources pay cavemen; in Totem they already score) |

Asset values decrease linearly with the turns left and are worth nothing during the last turn, so the bots spend their coins and resources before the end. With these values a knight is placed for a tax of 2 coins or more, and a building is bought when its points (crowns, end-game scoring, Queen) beat the value of the coins spent.

For an extension action, a bot enumerates the valid targets of the action (`getValidKnightPositions`, `getValidBuildingPositions` × `getAffordableBuildings`, `getValidFireTokenPositions`, `getValidCavemanPlacements`, `getValidGiantPositions`, `getValidGiantTargets`), plus "skip" when `canSkipOptionalAction` allows it, simulates each target with the action itself and keeps the best evaluation ("skip" first: a target must be strictly better than doing nothing). The strategies differ by how much the best opponent's score counts: 0 for `greedyStrategy`, ½ for `advancedStrategy`, 1 for `expertStrategy` (maximize the lead); the opponents' total only breaks ties (e.g. which opponent receives a giant).

| Action | Mode-aware choice |
|---|---|
| `placeKnight` | Square with the most taxes, when worth spending a knight. |
| `constructBuilding` | Building and square with the best points (crowns, end-game scoring, Queen) against its cost. |
| `useDragon` | Never used: burning a building costs coins and brings the player no points. |
| `placeFireToken` | Square multiplying the largest region. |
| `recruitCaveman` | Best visible caveman, square and payment. The face-down draw pile is not considered (simulating one of its cavemen would reveal it). The search is bounded: best square with the first payment of each caveman, then the best of its first 8 payments. |
| `placeGiant` (mandatory) | Crown that costs the deciding player the least — including a giant sent by an opponent (`ageOfGiants.pendingGiant`), where the targeted bot chooses the crown of its own kingdom. |
| `sendGiant` | Giant and opponent with the best evaluation; when the opponent must choose the crown, it is assumed to cover the crown that costs it the least. |

Domino picks and placements are mode-aware too: a placement is simulated on the kingdom (and, in Totem and Tribe, the resources of its squares are collected) and scored with the same evaluation, so the bots aim at Middle Kingdom, quests, fire regions, resources and totem majorities, and avoid covering crowns with giants. In Classic without extra rules the evaluation is the territory score, as before.

`randomStrategy` stays random: it picks uniformly among the valid targets, "skip" counting as one more option when the action is optional. Its choices are seeded by the game seed (or id) and the decision point, never by `Math.random`: the same game replayed with the same seed gets the same decisions. Every built-in bot is deterministic for a given seed.

#### Custom strategies

```typescript
type BotStrategy = {
  chooseDomino: (context: PickContext) => number;
  choosePlacement: (context: PlaceContext) => ValidPlacement | null;
  // Optional extension choices (null = skip the action)
  chooseKnightPosition?: (context: KnightContext) => Position | null;
  chooseBuilding?: (context: BuildingContext) => BuildingChoice | null;
  chooseDragonTarget?: (context: DragonContext) => number | null; // building id
  chooseFireTokenPosition?: (context: FireTokenContext) => Position | null;
  chooseCavemanRecruitment?: (context: CavemanContext) => CavemanChoice | null;
  chooseGiantPosition?: (context: GiantPositionContext) => Position | null;
  chooseGiantToSend?: (context: SendGiantContext) => SendGiantChoice | null;
};

type ExtensionContext = {
  game: GameWithNextAction;
  lordId: string;     // lord whose action it is
  playerId: string;   // deciding player (the targeted player for a sent giant)
  canSkip: boolean;   // whether returning null is allowed
};
type KnightContext = ExtensionContext & { validPositions: Position[] };
type BuildingContext = ExtensionContext & {
  validPositions: Position[];
  affordableBuildings: BuildingTile[];
};
type BuildingChoice = { buildingId: number; position: Position };
type DragonContext = ExtensionContext & { targetBuildings: BuildingTile[] };
type FireTokenContext = ExtensionContext & { validPositions: Position[] };
type CavemanContext = ExtensionContext & { recruitment: ValidCavemanPlacements };
type CavemanChoice = { cavemanId: number; position: Position; resourcePositions: Position[] };
type GiantPositionContext = ExtensionContext & {
  validPositions: Position[];
  sentByOpponent: boolean; // giant sent by an opponent (pendingGiant)
};
type SendGiantContext = ExtensionContext & { targets: ValidGiantTargets };
type SendGiantChoice = { giantIndex: number; targetPlayerId: string };
```

- Only `chooseDomino` and `choosePlacement` are required: a strategy written before the extension methods existed still compiles and works.
- An extension method is only called when the action has at least one valid target; every target of its context is accepted by the action.
- When a strategy has no method for an action, `playBotTurn` uses the choice of `greedyStrategy` (it exposes every method, as do the other built-in strategies, typed `BotStrategy & BotExtensionChoices`). To keep the former "skip everything" behaviour, define the methods and return `null`.
- `placeGiant` is mandatory: `null` falls back to the greedy choice.

```typescript
// Reuse the built-in placement logic, never send a giant
const cautious: BotStrategy = {
  ...greedyStrategy,
  chooseGiantToSend: () => null,
};
game = playBotTurns(engine, game, { cautious });
```

### Action Log

Record and replay game actions for history, audit, or replay features.

```typescript
import {
  createActionLog,
  appendAction,
  getActions,
  getActionsByTurn,
  getActionsByType,
  replayActions,
  wrapWithActionLog,
} from '@pompidup/kingdomino-engine';
```

| Export | Description |
|---|---|
| `createActionLog()` | Create a new empty action log. |
| `appendAction(log, entry)` | Append an action entry to the log. |
| `getActions(log)` | Get all recorded actions. |
| `getActionsByTurn(log, turn)` | Filter actions by turn number. |
| `getActionsByType(log, type)` | Filter actions by action type. |
| `replayActions(engine, log)` | Replay a recorded action log to reconstruct game state. |
| `wrapWithActionLog(engine, log)` | Wrap an engine to automatically record all actions. |

**Types:** `GameActionLog`, `ActionEntry`, `ActionType`, `ActionPayloadMap`.

### Debug Mode

Wrap the engine to emit detailed debug logs for every method call.

```typescript
import {
  wrapWithDebug,
  summarizeGameState,
} from '@pompidup/kingdomino-engine';
```

| Export | Description |
|---|---|
| `wrapWithDebug(engine, options?)` | Wrap an engine with debug logging. |
| `summarizeGameState(game)` | Extract a concise summary from a game state. |

**Types:** `DebugOptions`, `DebugLogger`, `DebugLogEntry`, `DebugLogLevel` (`"minimal"` | `"standard"` | `"verbose"`), `GameStateSummary`.

Debug mode can also be enabled via the `debug` field in `EngineConfig`.

### Game Events

Subscribe to game lifecycle events for UI integration, animations, or logging.

```typescript
import { wrapWithEvents } from '@pompidup/kingdomino-engine';
```

Events can be provided via `EngineConfig.events` or by wrapping an engine with `wrapWithEvents(engine, callbacks)`.

**`GameEventCallbacks` fields (all optional):**

| Callback | Trigger |
|---|---|
| `onGameCreated` | After `createGame` |
| `onPlayersAdded` | After `addPlayers` |
| `onGameStarted` | After `startGame` |
| `onDominoPicked` | After `chooseDomino` |
| `onNeolithicPairChosen` | After the `chooseDomino` that chose a Neolithic pair (receives `playerId`, `dominoNumbers`, `opponentDominoNumbers`), after `onDominoPicked` |
| `onDominoPlaced` | After `placeDomino` |
| `onDominoDiscarded` | After `discardDomino` |
| `onTurnStart` | When a new turn begins (derived) |
| `onTurnEnd` | When a turn ends (derived) |
| `onGameEnd` | When the game reaches the result phase (derived) |
| `onKnightPlaced` | After `placeKnight` (QueenDomino) |
| `onBuildingConstructed` | After `constructBuilding` (QueenDomino) |
| `onDragonUsed` | After `useDragon` (QueenDomino) |
| `onFireTokenPlaced` | After `placeFireToken` (Origins) |
| `onCavemanRecruited` | After `recruitCaveman` (Origins Tribe) |
| `onGiantPlaced` | After `placeGiant` (Age of Giants) |
| `onGiantSent` | After `sendGiant` (Age of Giants) |
| `onExtraRulesAdded` | After `addExtraRules` (receives `extraRules`) |
| `onOptionalActionSkipped` | After `skipOptionalAction` (receives the `skippedAction`) |

`onTurnEnd`/`onTurnStart` and `onGameEnd` are derived centrally from the state before and after **every** gameplay method: `onGameEnd` is emitted exactly once per game, whatever the action that reaches the `result` step (`placeDomino`, `discardDomino`, `skipOptionalAction`, `placeFireToken`, `recruitCaveman`, `useDragon`, `placeKnight`, `constructBuilding`, `placeGiant`, `sendGiant`…). The action-specific event is emitted first.

### Action Log Replay, Seeds and Stable Ids

`wrapWithActionLog` records **every** state-changing method, extension actions included: `createGame`, `addPlayers`, `addExtraRules`, `startGame`, `chooseDomino`, `placeDomino`, `discardDomino`, `placeGiant`, `sendGiant`, `placeKnight`, `constructBuilding`, `useDragon`, `placeFireToken`, `recruitCaveman`, `skipOptionalAction`.

| Payload | Content |
|---|---|
| `createGame` | `{ mode, seed, gameId }` — the **effective** seed (generated when the caller gave none) and the generated game id |
| `addPlayers` | `{ players: [{ id, name, bot? }] }` — players with the ids the engine assigned |
| `startGame` | `{ lordIds }` — lord ids in `game.lords` order |
| `placeKnight` / `placeFireToken` / `placeGiant` | `{ lordId, position }` |
| `constructBuilding` | `{ lordId, buildingId, position }` |
| `useDragon` | `{ lordId, buildingId }` |
| `recruitCaveman` | `{ lordId, cavemanId, position, resourcePositions }` |
| `sendGiant` | `{ lordId, giantIndex, targetPlayerId, targetCrownPosition? }` |
| `skipOptionalAction` | `{ lordId }` |

`placeGiant` may be recorded with the lord of the **targeted** player (a giant sent by an opponent, `ageOfGiants.pendingGiant`); the replay plays it the same way.

**Strictly identical replay.** `replayActions(engine, log)` restores the recorded seed, game id, player ids and lord ids, so the replayed state deep-equals the original one — whatever the replay engine's `uuidMethod` or `shuffleMethod`. The log is plain JSON (`JSON.stringify` / `JSON.parse`).

**Versioning.** `GameActionLog.version` is `ACTION_LOG_VERSION` (`2`). Legacy logs without `version` (v1: no seed, plain player names, empty `startGame` payload) remain replayable, with regenerated ids; a log with a newer version is refused.

```typescript
import { ACTION_LOG_VERSION, replayActions, wrapWithActionLog } from '@pompidup/kingdomino-engine';

const { engine, getLog } = wrapWithActionLog(createGameEngine({}));
// ... play a game ...
const saved = JSON.stringify(getLog());
const replayed = replayActions(createGameEngine({}), JSON.parse(saved)); // deep-equals the original
```

**Dynasty: recommended setup.** `getDynastyResults` groups players by `playerId`, and `addPlayers` generates new ids for every game. For a Dynasty, pass the same stable id for each person in every game:

```typescript
const players = [{ id: 'user-alice', name: 'Alice' }, { id: 'user-bob', name: 'Bob' }];
game1 = engine.addPlayers({ game: game1, players });
game2 = engine.addPlayers({ game: game2, players });
engine.getDynastyResults({ games: [results1, results2, results3] });
```

For games created without stable ids, group by name instead (names must then be unique per game): `engine.getDynastyResults({ games, groupBy: 'playerName' })`. The returned `playerId` is then the one from the first game where the name appears.

### Undo/Redo History

Manage game state history for undo and redo operations.

```typescript
import {
  createGameHistory,
  pushState,
  undo,
  redo,
  canUndo,
  canRedo,
  clearHistory,
  getHistorySize,
} from '@pompidup/kingdomino-engine';
```

| Export | Description |
|---|---|
| `createGameHistory()` | Create a new empty history stack. |
| `pushState(history, state)` | Push a new state onto the history, clearing any redo stack. |
| `undo(history)` | Undo to the previous state. Throws `UndoError` if unavailable. |
| `redo(history)` | Redo to the next state. Throws `RedoError` if unavailable. |
| `canUndo(history)` | Returns `true` if undo is possible. |
| `canRedo(history)` | Returns `true` if redo is possible. |
| `clearHistory(history)` | Clear all history entries. |
| `getHistorySize(history)` | Returns the number of states in the history. |

**Type:** `GameHistory`.

### Serialization

Persist and restore game state, or create save points.

```typescript
import {
  serializeGame,
  deserializeGame,
  createSavePoint,
  restoreFromSavePoint,
} from '@pompidup/kingdomino-engine';
```

| Export | Description |
|---|---|
| `serializeGame(game)` | Convert a game state to a JSON string. |
| `deserializeGame(json)` | Parse a JSON string back to a game state. |
| `createSavePoint(game)` | Create a save point from the current state. |
| `restoreFromSavePoint(savePoint)` | Restore a game state from a save point. |

**Type:** `GameSavePoint`.

The engine also provides `serialize` and `deserialize` methods directly on the `GameEngine` interface (see [Core Methods](#serialization-methods)).

### Internationalization (i18n)

The engine ships translation dictionaries for error messages, game modes, extra rules, terrains, resources, cavemen, game phases and player actions.

```typescript
import {
  TranslationKey,
  createTranslator,
  defaultTranslator,
  translateErrorCode,
  localeTranslations,
  supportedLocales,          // ["en", "fr"]
  englishTranslations,       // === defaultTranslations
  frenchTranslations,
  groundToTranslationKey,
  playerActionToTranslationKey,
  modeNameToTranslationKey,
  extraRuleNameToTranslationKey,
  resourceToTranslationKey,
  cavemanKindToTranslationKey,
  hunterGathererKindToTranslationKey,
  warriorTypeToTranslationKey,
} from '@pompidup/kingdomino-engine';

const t = createTranslator(localeTranslations.fr); // or frenchTranslations
t.t(groundToTranslationKey.volcano);                // "Volcan"
t.t(playerActionToTranslationKey.recruitCaveman);   // "Recruter un homme préhistorique"
t.t(modeNameToTranslationKey["KingdominoOrigins-Tribe"]); // "Kingdomino Origins — Tribu"

const engine = createGameEngine({ translator: t }); // localized error messages
```

| Export | Description |
|---|---|
| `TranslationKey` / `TranslationKeyType` | All translation keys (`error.*`, `mode.*`, `rule.*`, `ground.*`, `resource.*`, `caveman.*`, `phase.*`, `action.*`). |
| `defaultTranslations` / `englishTranslations` | English dictionary (fallback for missing keys). |
| `frenchTranslations` | French dictionary. |
| `localeTranslations`, `supportedLocales`, `SupportedLocale` | Built-in dictionaries indexed by locale (`"en"`, `"fr"`); every dictionary defines every key. |
| `createTranslator(translations?)` | Create a `Translator`; missing keys fall back to English. Supports `{{param}}` interpolation. |
| `defaultTranslator` | English translator. |
| `translateErrorCode(translator, code, params?)` | Translate an `ErrorCode`. |
| `errorCodeToTranslationKey` | `ErrorCode` → key. |
| `groundToTranslationKey` | `Ground` → key (all Classic and Origins terrains). |
| `playerActionToTranslationKey` | `PlayerActions` → key (`pickDomino`, `placeDomino`, `pass`, `placeKnight`, `constructBuilding`, `useDragon`, `skipOptionalAction`, `placeGiant`, `sendGiant`, `placeFireToken`, `recruitCaveman`). |
| `modeNameToTranslationKey` | `GameMode["name"]` (as returned by `getModes`) → key. |
| `extraRuleNameToTranslationKey` | `ExtraRule["name"]` (as returned by `getExtraRules`) → key. |
| `resourceToTranslationKey` | `ResourceType` → key. |
| `cavemanKindToTranslationKey`, `hunterGathererKindToTranslationKey`, `warriorTypeToTranslationKey` | Caveman kind / hunter-gatherer type / warrior type → key. |

---

## Type Guards

The following type guards are exported:

| Guard | Narrows |
|---|---|
| `isGameWithNextAction(game)` | `GameState` → `GameWithNextAction` |
| `isGameWithNextStep(game)` | `GameState` → `GameWithNextStep` |
| `isGameWithResults(game)` | `Game` → `GameWithResults` |
| `isHunterGathererTile(caveman)` | `CavemanTile` → `HunterGathererTile` |
| `isWarriorTile(caveman)` | `CavemanTile` → `WarriorTile` |

### `isGameWithNextAction`

```typescript
const isGameWithNextAction: (game: GameState) => game is GameWithNextAction;
```

Returns `true` when the game is in active play and a player action is required. Use this to drive the main game loop.

```typescript
import { isGameWithNextAction } from '@pompidup/kingdomino-engine';

while (isGameWithNextAction(game)) {
  const { nextLord, nextAction } = game.nextAction;
  // handle pickDomino, placeDomino, pass, placeKnight, etc.
}
```

### `isGameWithNextStep`

```typescript
const isGameWithNextStep: (game: GameState) => game is GameWithNextStep;
```

Returns `true` when the game is in a phase transition (setup or game end). Check `game.nextAction.step` to determine the current phase:

- `"addPlayers"` -- waiting for players to be added
- `"options"` -- optional rules selection
- `"start"` -- ready to start the game
- `"result"` -- game has ended, call `getResults` to compute final scores

### `isGameWithResults`

```typescript
const isGameWithResults: (game: Game | GameWithResults) => game is GameWithResults;
```

Returns `true` when the game carries a `result: FinalResult[]` array, i.e. the state returned by `getResults`. Note that a game in the `"result"` step (`isGameWithNextStep(game) && game.nextAction.step === "result"`) does not carry results until `getResults` has been called.

```typescript
import { isGameWithResults } from '@pompidup/kingdomino-engine';

const stored: Game = loadGame();
if (isGameWithResults(stored)) {
  const winner = stored.result.find((r) => r.position === 1);
}
```

### `isHunterGathererTile` / `isWarriorTile`

```typescript
const isHunterGathererTile: (caveman: CavemanTile) => caveman is HunterGathererTile;
const isWarriorTile: (caveman: CavemanTile) => caveman is WarriorTile;
```

Narrow a caveman tile (Origins Tribe mode) on its `kind` discriminant (`cavemanKinds.hunterGatherer` / `cavemanKinds.warrior`).

```typescript
import { isWarriorTile, isHunterGathererTile } from '@pompidup/kingdomino-engine';

for (const caveman of game.origins?.caveBoard?.visible ?? []) {
  if (isWarriorTile(caveman)) {
    console.log(`Warrior (${caveman.warriorType}), power ${caveman.power}`);
  } else if (isHunterGathererTile(caveman)) {
    console.log(`${caveman.hunterType}: ${caveman.pointsPerMatch} pts/match`);
  }
}
```

---

## Valid targets for extension actions

Read-only queries listing the valid targets of the extension actions (Queendomino, Origins, Age of Giants), so a client never has to re-implement a game rule to highlight squares, buildings, cavemen or opponents.

Each query is built on the **same checks** as the matching action (the use case's `resolve*` function and the very predicate it applies to its target):

- every target returned is accepted by the action;
- every target left out is refused by it.

All queries share the same command and never throw:

```typescript
type GetValidActionTargetsCommand = {
  game: GameState;   // any state is accepted
  lordId?: string;   // default: the lord to play (game.nextAction.nextLord)
};
```

They answer empty (`[]`, empty lists, or `false`) when the game does not wait for the matching action (other action, setup or result step, other mode) or when `lordId` is not the lord to play.

| Method | Command Type | Return Type | Action |
|---|---|---|---|
| `getValidFireTokenPositions` | `GetValidFireTokenPositionsCommand` | `Position[]` | `placeFireToken` (Origins) |
| `getValidKnightPositions` | `GetValidKnightPositionsCommand` | `Position[]` | `placeKnight` (Queendomino, AoG-QD) |
| `getValidBuildingPositions` | `GetValidBuildingPositionsCommand` | `Position[]` | `constructBuilding` (Queendomino, AoG-QD) |
| `getAffordableBuildings` | `GetAffordableBuildingsCommand` | `BuildingTile[]` | `constructBuilding` (Queendomino, AoG-QD) |
| `getValidCavemanPlacements` | `GetValidCavemanPlacementsCommand` | `ValidCavemanPlacements` | `recruitCaveman` (Origins Tribe) |
| `getValidGiantPositions` | `GetValidGiantPositionsCommand` | `Position[]` | `placeGiant` (Age of Giants) |
| `getValidGiantTargets` | `GetValidGiantTargetsCommand` | `ValidGiantTargets` | `sendGiant` (Age of Giants) |
| `canSkipOptionalAction` | `CanSkipOptionalActionCommand` | `boolean` | `skipOptionalAction` |

All command types are aliases of `GetValidActionTargetsCommand`.

### `getValidFireTokenPositions`

Squares where the pending fire token (`game.origins.pendingFireToken`) can land: exactly `fires` squares away from the volcano (8 directions, direction changes allowed), on a placed tile that is neither a volcano nor the castle, without fire symbol and without fire token.

```typescript
if (game.nextAction.nextAction === 'placeFireToken') {
  const squares = engine.getValidFireTokenPositions({ game });
  game = squares.length > 0
    ? engine.placeFireToken({ game, lordId, position: squares[0] })
    : engine.skipOptionalAction({ game, lordId });
}
```

### `getValidKnightPositions`

Squares where `placeKnight` accepts a knight: the squares of the domino the lord has just placed (`queendomino.lastPlacedPositions`), while the player is below its knight limit (3 + `bonusKnights`), and only in a territory without knight.

### `getValidBuildingPositions` / `getAffordableBuildings`

`getValidBuildingPositions` returns the free construction squares of the player and `getAffordableBuildings` the buildings of the Builders Board the player can pay for. **Any** building of the second list can be built on **any** square of the first one. Both are empty as soon as one of them is (a construction needs a square and a building).

```typescript
const squares = engine.getValidBuildingPositions({ game });
const buildings = engine.getAffordableBuildings({ game });
if (buildings.length > 0) {
  game = engine.constructBuilding({
    game, lordId, buildingId: buildings[0].id, position: squares[0],
  });
}
```

### `getValidCavemanPlacements`

```typescript
type CavemanRecruitmentOption = {
  cavemanId: number;                 // cavemanId for recruitCaveman
  source: 'visible' | 'drawPile';    // 2 or 4 different resources
  resourceCombinations: Position[][]; // every valid resourcePositions payment
};

type ValidCavemanPlacements = {
  options: CavemanRecruitmentOption[]; // recruitable cavemen
  positions: Position[];               // squares for the recruited caveman
};
```

Any option, any of its resource combinations and any position can be combined into a valid `recruitCaveman` call. A combination lists the positions of the resources to spend, each set of resources once (`recruitCaveman` accepts them in any order). Draw-pile cavemen share the same combinations (4 different resources); visible ones share theirs (2 different resources). Both lists are empty when no recruitment is possible (no valid payment or no free square).

```typescript
const { options, positions } = engine.getValidCavemanPlacements({ game });
if (options.length > 0) {
  const [option] = options;
  game = engine.recruitCaveman({
    game,
    lordId,
    cavemanId: option.cavemanId,
    position: positions[0],
    resourcePositions: option.resourceCombinations[0],
  });
}
```

### `getValidGiantPositions`

Crowns where `placeGiant` accepts the giant: crowns not covered by a giant yet, in the kingdom of the lord to play. When a giant was sent by an opponent (`game.ageOfGiants.pendingGiant`), the lord to play belongs to the targeted player and the positions are that player's own free crowns. `placeGiant` is mandatory: the engine only asks for it when at least one crown is free, so the list is never empty during a `placeGiant` action.

### `getValidGiantTargets`

```typescript
type ValidGiantTargets = {
  giantIndexes: number[];    // indexes in the sender's `giants` array
  targetPlayerIds: string[]; // opponents with at least one free crown
};
```

Any giant index can be sent to any target player. Both lists are empty when no giant can be sent. The crown is chosen by the targeted opponent: call `sendGiant` without `targetCrownPosition`; when the opponent has several free crowns, the game then waits for a `placeGiant` of that opponent (see `getValidGiantPositions`).

### `canSkipOptionalAction`

Whether `skipOptionalAction` accepts to skip the current action for the lord: `true` for the optional actions (`placeKnight`, `constructBuilding`, `useDragon`, `placeFireToken`, `recruitCaveman`, `sendGiant`), `false` for `placeGiant` (mandatory), `pickDomino`, `placeDomino`, `pass` and outside an action.

The underlying rule is also exported as a pure helper:

```typescript
import { isSkippableAction } from '@pompidup/kingdomino-engine';

isSkippableAction('sendGiant');  // true
isSkippableAction('placeGiant'); // false
```

---

## Score Breakdown

`calculatePlayerScore` returns the **mode-aware** score of one player with a detailed breakdown (every territory and every bonus of the game mode). `getResults` uses exactly the same computation: each `FinalResult` carries the same `breakdown`, and `details.points === breakdown.total`.

Unlike `calculateScore` (territories of a single kingdom only), it takes the game into account: Queen and buildings (Queendomino), fire tokens, resources, totems and cavemen (Origins), giants and quest tiles (Age of Giants) and the optional rules (The middle Kingdom, Harmony, Empire of Fire, Homo Habilis).

### `calculatePlayerScore`

```typescript
calculatePlayerScore: (command: CalculatePlayerScoreCommand) => PlayerScore;
```

Throws a `NotFoundError` (`PLAYER_NOT_FOUND`) when the player is not in the game.

```typescript
const score = engine.calculatePlayerScore({ game, playerId });
console.log(score.points, score.final ? 'final' : 'live');

for (const territory of score.breakdown.territories) {
  highlight(territory.cells, `${territory.cells.length} × ${territory.crowns}`);
}
for (const bonus of score.breakdown.bonuses) {
  console.log(translator.t(bonus.label, bonus.labelParams), bonus.points);
}
```

### `CalculatePlayerScoreCommand`

```typescript
type CalculatePlayerScoreCommand = {
  game: Game;       // Any stage: in progress, over, or the state returned by getResults
  playerId: string; // Player to score
};
```

### `PlayerScore`

```typescript
type PlayerScore = {
  playerId: string;
  playerName: string;
  points: number;            // Total score (= breakdown.total)
  maxPropertiesSize: number; // Largest territory (tie-breaker)
  totalCrowns: number;       // Crowns counted in the kingdom
  final: boolean;            // true once the game is over (identical to getResults)
  breakdown: ScoreBreakdown;
};
```

### `ScoreBreakdown`

```typescript
type ScoreBreakdown = {
  territories: ScoreTerritory[];
  bonuses: ScoreBonus[];
  territoryPoints: number; // Sum of the territory points
  bonusPoints: number;     // Sum of the bonus points
  total: number;           // territoryPoints + bonusPoints
};
```

### `ScoreTerritory`

```typescript
type ScoreTerritory = {
  terrain: Ground;
  cells: Position[];     // Squares of the territory, sorted by row then column
  crowns: number;        // Crowns counted (crowns covered by giants excluded)
  coveredCrowns: number; // Crowns covered by Age of Giants giants
  points: number;        // cells.length * crowns
};
```

### `ScoreBonus`

```typescript
type ScoreBonus = {
  type: ScoreBonusType;
  label: TranslationKeyType;                       // translator.t(label, labelParams)
  labelParams?: Record<string, string | number>;   // e.g. { name: 'The Sawmill' }
  points: number;                                  // May be 0 when the condition is not met
  provisional: boolean;                            // true while the game is in progress
  buildingId?: number;   // building
  questId?: number;      // quest
  questType?: QuestType; // quest
  terrain?: Ground;      // quest (Local Trade, Kingdom Borders)
  resource?: ResourceType; // totem
  cavemanId?: number;    // hunterGatherer
  position?: Position;   // building, hunterGatherer
};
```

| `type` | Mode | Label | Listed when |
|---|---|---|---|
| `middleKingdom` | Classic / Queendomino | `rule.middleKingdom` | "The middle Kingdom" rule is active (10 or 0) |
| `empireOfFire` | Origins | `rule.empireOfFire` | "Empire of Fire" rule is active (10 or 0) |
| `harmony` | Classic / Queendomino | `rule.harmony` | "Harmony" rule is active, **end of game only** (5 or 0) |
| `homoHabilis` | Origins | `rule.homoHabilis` | "Homo Habilis" rule is active, **end of game only** (5 or 0) |
| `queen` | Queendomino, AoG-QD | `score.queen` | The player hosts the Queen (size of the largest territory) |
| `building` | Queendomino, AoG-QD | `score.building` (`{{name}}`) | One per constructed building with an end-game scoring |
| `quest` | Age of Giants | `quest.<questType>` | One per quest tile; the Harmony quest at the end of game only |
| `totem` | Origins Totem | `score.totem<Resource>` | One per totem held by the player |
| `resources` | Origins Totem | `score.resources` | Always (1 point per resource left) |
| `hunterGatherer` | Origins Tribe | `caveman.<hunterType>` | One per recruited hunter-gatherer |
| `warriors` | Origins Tribe | `score.warriors` | The player has at least one warrior (all groups) |
| `fire` | Origins | `score.fire` | The player placed at least one fire token |

`scoreBonusTypes` lists every type; `questTypeToTranslationKey` and `totemToTranslationKey` map quest types and totems to their label. Every label exists in English and French.

### Live score vs final score

- **Game in progress** (`final: false`): the score reflects the current state. Territories, The middle Kingdom / Empire of Fire, the Queen (current host), buildings, fire tokens, resources, totems (current resource-majority holders), cavemen and every quest except Harmony are evaluated now and flagged `provisional: true`: they can still change before the end.
- **End-of-game-only bonuses**: Harmony, Homo Habilis and the Harmony quest need the complete kingdom (every received domino placed). They are not part of the live score and only appear once the game is over.
- **Game over** (`nextAction.step === "result"`, `final: true`): every bonus is final (`provisional: false`) and the score is identical to the one returned by `getResults`.
