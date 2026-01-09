import type {
  Domino,
  Position,
  Rotation,
  FinalResult,
  GameState,
} from "@core/domain/types/index.js";

/**
 * All possible game event types.
 */
export const GameEventType = {
  GAME_CREATED: "game:created",
  PLAYERS_ADDED: "game:playersAdded",
  GAME_STARTED: "game:started",
  DOMINO_PICKED: "domino:picked",
  DOMINO_PLACED: "domino:placed",
  DOMINO_DISCARDED: "domino:discarded",
  TURN_CHANGED: "turn:changed",
  GAME_ENDED: "game:ended",
} as const;

export type GameEventTypeValue =
  (typeof GameEventType)[keyof typeof GameEventType];

/**
 * Base event structure with common properties.
 */
interface BaseEvent {
  /** Event type identifier */
  type: GameEventTypeValue;
  /** Timestamp when the event occurred */
  timestamp: string;
  /** Game ID this event belongs to */
  gameId: string;
}

/**
 * Event emitted when a new game is created.
 */
export interface GameCreatedEvent extends BaseEvent {
  type: typeof GameEventType.GAME_CREATED;
  mode: string;
}

/**
 * Event emitted when players are added to the game.
 */
export interface PlayersAddedEvent extends BaseEvent {
  type: typeof GameEventType.PLAYERS_ADDED;
  playerNames: string[];
  playerCount: number;
}

/**
 * Event emitted when the game starts.
 */
export interface GameStartedEvent extends BaseEvent {
  type: typeof GameEventType.GAME_STARTED;
  firstLordId: string;
}

/**
 * Event emitted when a lord picks a domino.
 */
export interface DominoPickedEvent extends BaseEvent {
  type: typeof GameEventType.DOMINO_PICKED;
  lordId: string;
  playerId: string;
  domino: Domino;
}

/**
 * Event emitted when a lord places a domino.
 */
export interface DominoPlacedEvent extends BaseEvent {
  type: typeof GameEventType.DOMINO_PLACED;
  lordId: string;
  playerId: string;
  domino: Domino;
  position: Position;
  rotation: Rotation;
}

/**
 * Event emitted when a lord discards a domino.
 */
export interface DominoDiscardedEvent extends BaseEvent {
  type: typeof GameEventType.DOMINO_DISCARDED;
  lordId: string;
  playerId: string;
  domino: Domino;
}

/**
 * Event emitted when the turn changes.
 */
export interface TurnChangedEvent extends BaseEvent {
  type: typeof GameEventType.TURN_CHANGED;
  previousTurn: number;
  newTurn: number;
  nextLordId: string;
}

/**
 * Event emitted when the game ends.
 */
export interface GameEndedEvent extends BaseEvent {
  type: typeof GameEventType.GAME_ENDED;
  results: FinalResult[];
  winner: {
    playerId: string;
    playerName: string;
    score: number;
  };
}

/**
 * Union type of all game events.
 */
export type GameEvent =
  | GameCreatedEvent
  | PlayersAddedEvent
  | GameStartedEvent
  | DominoPickedEvent
  | DominoPlacedEvent
  | DominoDiscardedEvent
  | TurnChangedEvent
  | GameEndedEvent;

/**
 * Event listener function type.
 */
export type GameEventListener<T extends GameEvent = GameEvent> = (
  event: T
) => void;

/**
 * Event emitter for game events.
 * Allows subscribing to specific event types or all events.
 */
export class GameEventEmitter {
  private listeners: Map<GameEventTypeValue | "*", GameEventListener[]> =
    new Map();

  /**
   * Subscribe to a specific event type.
   *
   * @param eventType - The event type to listen for, or "*" for all events
   * @param listener - The callback function to invoke
   * @returns Unsubscribe function
   */
  on<T extends GameEvent>(
    eventType: T["type"] | "*",
    listener: GameEventListener<T>
  ): () => void {
    const listeners = this.listeners.get(eventType) || [];
    listeners.push(listener as GameEventListener);
    this.listeners.set(eventType, listeners);

    // Return unsubscribe function
    return () => {
      const currentListeners = this.listeners.get(eventType) || [];
      const index = currentListeners.indexOf(listener as GameEventListener);
      if (index > -1) {
        currentListeners.splice(index, 1);
      }
    };
  }

  /**
   * Emit an event to all registered listeners.
   *
   * @param event - The event to emit
   */
  emit(event: GameEvent): void {
    // Notify specific event type listeners
    const typeListeners = this.listeners.get(event.type) || [];
    typeListeners.forEach((listener) => listener(event));

    // Notify wildcard listeners
    const wildcardListeners = this.listeners.get("*") || [];
    wildcardListeners.forEach((listener) => listener(event));
  }

  /**
   * Remove all listeners for a specific event type or all listeners.
   *
   * @param eventType - Optional event type to clear, clears all if not provided
   */
  clear(eventType?: GameEventTypeValue | "*"): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }
}

/**
 * Creates an event with common properties filled in.
 */
export const createEvent = <T extends GameEvent>(
  gameId: string,
  type: T["type"],
  data: Omit<T, "type" | "timestamp" | "gameId">
): T => {
  return {
    type,
    timestamp: new Date().toISOString(),
    gameId,
    ...data,
  } as T;
};
