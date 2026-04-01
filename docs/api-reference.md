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
7. [Error Codes](#error-codes)
8. [Utilities](#utilities)
9. [Type Guards](#type-guards)

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
| `getExtraRules` | `GetExtraRulesCommand` | `ExtraRule[]` | Get available extra rules for a mode and player count. |
| `createGame` | `CreateGameCommand` | `GameWithNextStep` | Create a new game instance with the specified mode. |
| `addPlayers` | `AddPlayersCommand` | `GameWithNextStep` | Add players (human or bot) and initialize their kingdoms. |
| `addExtraRules` | `AddExtraRulesCommand` | `GameWithNextStep` | Add optional extra rules to modify gameplay. |
| `startGame` | `StartGameCommand` | `GameWithNextAction` | Start the game, shuffle dominoes, reveal the first set. |

### Gameplay Methods

| Method | Command Type | Return Type | Description |
|---|---|---|---|
| `chooseDomino` | `ChooseDominoCommand` | `GameWithNextAction` | A lord picks a domino from the revealed set. |
| `placeDomino` | `PlaceDominoCommand` | `GameState` | Place a domino on the lord's kingdom at the given position and rotation. |
| `discardDomino` | `DiscardDominoCommand` | `GameState` | Discard a domino when no valid placement exists. |

### Queendomino Methods

| Method | Command Type | Return Type | Description |
|---|---|---|---|
| `placeKnight` | `PlaceKnightCommand` | `GameState` | Place a knight on the lord's kingdom at the specified position. |
| `constructBuilding` | `ConstructBuildingCommand` | `GameState` | Construct a building on a construction square in the lord's kingdom. |
| `useDragon` | `UseDragonCommand` | `GameState` | Use the dragon to destroy a building tile on the builders board. |
| `skipOptionalAction` | `SkipOptionalActionCommand` | `GameState` | Skip the current optional action (knight, building, or dragon). |

### Scoring and Results

| Method | Command Type | Return Type | Description |
|---|---|---|---|
| `getResults` | `GetResultCommand` | `GameWithResults` | Calculate final results after the game ends. |
| `calculateScore` | `CalculateScoreCommand` | `Score` | Calculate the score for a single kingdom (live scoring). |
| `getDynastyResults` | `GetDynastyResultCommand` | `DynastyResult[]` | Aggregate results from multiple completed games. |

### Query Methods

| Method | Command Type | Return Type | Description |
|---|---|---|---|
| `getValidPlacements` | `GetValidPlacementsCommand` | `ValidPlacement[]` | Find all valid placements for a domino on a kingdom. |
| `canPlaceDomino` | `CanPlaceDominoCommand` | `boolean` | Check if a domino can be placed anywhere on a kingdom. |

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
type PlayerInput = string | { name: string; bot?: { strategyName: string } };

type AddPlayersCommand = {
  game: GameState;
  players: PlayerInput[];  // 1-4 players; strings for humans, objects for bots
};
```

### `AddExtraRulesCommand`

```typescript
type AddExtraRulesCommand = {
  game: GameState;
  extraRules: string[];  // Rule names (e.g., ["The middle Kingdom", "Harmony"])
};
```

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
type GetDynastyResultCommand = {
  games: GameWithResults[];
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
  queendomino?: QueenDominoState;
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
type Ground = "castle" | "wheat" | "forest" | "sea" | "plain" | "swamp" | "mine";
```

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
  position: number;       // Display position in the revealed set
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
  buildings?: PlacedBuilding[]; // Queendomino
};
```

### `PlayerInput`

Used when adding players. A plain string creates a human player; an object can specify a bot strategy.

```typescript
type PlayerInput = string | { name: string; bot?: { strategyName: string } };
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
  | "skipOptionalAction"; // Queendomino
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
  dragonUsedThisRound: boolean;
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
| `randomStrategy` | Picks and places dominoes randomly. |
| `greedyStrategy` | Maximizes immediate crown-territory score. |
| `advancedStrategy` | Uses heuristics for better long-term placement. |
| `expertStrategy` | Most sophisticated strategy with look-ahead. |
| `isBotTurn(game)` | Returns `true` if the current lord belongs to a bot player. |
| `playBotTurn(engine, game)` | Plays a single bot turn, returns updated game state. |
| `playBotTurns(engine, game)` | Plays all consecutive bot turns until a human must act. |
| `getStrategy(name)` | Look up a strategy by name from the registry. |
| `getStrategyNames()` | Returns all registered strategy names. |

**Types:** `BotStrategy`, `PickContext`, `PlaceContext`, `StrategyName`.

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
| `onDominoPlaced` | After `placeDomino` |
| `onDominoDiscarded` | After `discardDomino` |
| `onTurnStart` | When a new turn begins (derived) |
| `onTurnEnd` | When a turn ends (derived) |
| `onGameEnd` | When the game reaches the result phase (derived) |

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

---

## Type Guards

Two type guards are exported to narrow `GameState` to its specific variant:

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
