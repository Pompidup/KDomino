import type { GameState, isGameWithNextAction } from "@core/domain/types/game.js";
import type { Domino } from "@core/domain/types/domino.js";
import type { Placement } from "@core/domain/types/placement.js";
import {
  GRIDSIZE,
  type Kingdom,
  type Position,
  type Rotation,
} from "@core/domain/types/kingdom.js";
import { placeDomino } from "@core/domain/entities/kingdom.js";
import { isOk } from "@utils/result.js";

export const chooseDominoAI = (
  gameState: GameState,
  playerId: string
): number | null => {
  if (!gameState || !playerId) {
    console.error("Invalid input for chooseDominoAI");
    return null;
  }

  const availableDominoes = gameState.currentDominoes.filter(
    (d) => !d.picked
  );

  if (availableDominoes.length === 0) {
    return null; // Should ideally not happen if called at the right time
  }

  const randomIndex = Math.floor(Math.random() * availableDominoes.length);
  return availableDominoes[randomIndex].domino.number;
};

export const placeDominoAI = (
  gameState: GameState,
  playerId: string
): Placement | null => {
  if (!gameState || !playerId) {
    console.error("Invalid input for placeDominoAI");
    return null;
  }

  if (!isGameWithNextAction(gameState)) {
    console.error("placeDominoAI called when game is not in an action step");
    return null;
  }

  const player = gameState.players.find((p) => p.id === playerId);
  if (!player) {
    console.error(`Player ${playerId} not found in gameState`);
    return null;
  }

  const kingdom = player.kingdom;

  // Find the domino the player picked
  const pickedDominoEntry = gameState.currentDominoes.find(
    (entry) => entry.lordId === playerId && entry.picked // Ensure it's picked by this player
  );

  if (!pickedDominoEntry) {
    // This case implies the AI is trying to place a domino it hasn't picked or already placed.
    // Or it's not this AI's turn to place (already handled by game flow usually).
    // If the game expects a placement, there should be a picked domino.
    // Check if there's *any* picked domino for this player, even if it's from previous turns (though game logic should prevent this)
    const dominoToPlace = gameState.players.find(p => p.id === playerId)?.kingdom.dominoToPlace; // Assuming kingdom might hold this info if not in currentDominoes
    if (!dominoToPlace) {
      console.error(
        `No domino found for player ${playerId} to place.`
      );
      return null;
    }
    // If found in player.kingdom.dominoToPlace, use it. This part is speculative based on common game structures.
    // For now, strictly rely on currentDominoes.
    console.error(`No picked (and not yet placed) domino found for player ${playerId} in currentDominoes.`);
    return null;
  }

  const dominoToPlace = pickedDominoEntry.domino;

  const rotations: Rotation[] = [0, 90, 180, 270];

  for (let y = 0; y < GRIDSIZE; y++) {
    for (let x = 0; x < GRIDSIZE; x++) {
      for (const rotation of rotations) {
        const currentPosition: Position = { x, y };
        const placementResult = placeDomino(
          kingdom,
          currentPosition,
          rotation,
          dominoToPlace
        );

        if (isOk(placementResult)) {
          return { position: currentPosition, rotation };
        }
      }
    }
  }

  // Should not be reached if there's always a valid move,
  // but as a fallback or if game rules allow getting stuck.
  console.warn(`No valid placement found for player ${playerId}`);
  return null;
};
