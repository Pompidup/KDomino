import { describe, it, expect, vi } from "vitest";
import { chooseDominoAI, placeDominoAI } from "@core/ai/decisions.js";
import type { GameState, GameWithNextAction } from "@core/domain/types/game.js";
import type { Domino, RevealsDomino } from "@core/domain/types/domino.js";
import type { Player } from "@core/domain/types/player.js";
import { createPlayer } from "@core/domain/entities/player.js";
import { createEmptyKingdom, placeCastle } from "@core/domain/entities/kingdom.js";
import type { Placement } from "@core/domain/types/placement.js";
import { playerActions } from "@core/domain/types/player.js";

// Mock data and helpers will go here

describe("chooseDominoAI", () => {
  const mockPlayerId = "aiPlayer1";
  const createMockGameState = (availableDominoes: RevealsDomino[]): GameWithNextAction => {
    return {
      id: "game1",
      dominoes: [], // Full deck
      currentDominoes: availableDominoes,
      players: [
        createPlayer(mockPlayerId, mockPlayerId, placeCastle(createEmptyKingdom()), true).value // Assuming createPlayer returns Result
      ],
      lords: [], // Simplified for this test
      turn: 1,
      nextAction: {
        type: "action",
        nextLord: mockPlayerId,
        nextAction: playerActions.pickDomino,
      },
      rules: { basic: { dominoesPerTurn: 4, maxTurns: 12, kingdomSize: 5 } }, // Simplified
      mode: "Kingdom", // Simplified
    } as GameWithNextAction; // Type assertion for simplicity in test setup
  };

  it("should pick a valid, available domino", () => {
    const domino1: Domino = { number: 1, left: { type: "forest", crowns: 0 }, right: { type: "wheat", crowns: 0 } };
    const domino2: Domino = { number: 2, left: { type: "sea", crowns: 0 }, right: { type: "mine", crowns: 1 } };
    const availableDominoes: RevealsDomino[] = [
      { domino: domino1, picked: false, lordId: null, position: 1 },
      { domino: domino2, picked: false, lordId: null, position: 2 },
    ];
    const gameState = createMockGameState(availableDominoes);
    const chosenDominoNumber = chooseDominoAI(gameState, mockPlayerId);
    expect(chosenDominoNumber).not.toBeNull();
    expect(availableDominoes.map(d => d.domino.number)).toContain(chosenDominoNumber);
  });

  it("should return null if no dominoes are available", () => {
    const gameState = createMockGameState([]);
    const chosenDominoNumber = chooseDominoAI(gameState, mockPlayerId);
    expect(chosenDominoNumber).toBeNull();
  });

  it("should pick from remaining dominoes if some are already picked", () => {
    const domino1: Domino = { number: 1, left: { type: "forest", crowns: 0 }, right: { type: "wheat", crowns: 0 } };
    const domino2: Domino = { number: 2, left: { type: "sea", crowns: 0 }, right: { type: "mine", crowns: 1 } };
    const domino3: Domino = { number: 3, left: { type: "plain", crowns: 0 }, right: { type: "swamp", crowns: 0 } };
    const availableDominoes: RevealsDomino[] = [
      { domino: domino1, picked: true, lordId: "otherPlayer", position: 1 },
      { domino: domino2, picked: false, lordId: null, position: 2 },
      { domino: domino3, picked: false, lordId: null, position: 3 },
    ];
    const gameState = createMockGameState(availableDominoes);
    const chosenDominoNumber = chooseDominoAI(gameState, mockPlayerId);
    expect(chosenDominoNumber).not.toBeNull();
    expect([domino2.number, domino3.number]).toContain(chosenDominoNumber);
  });

   it("should return null if gameState is null", () => {
    const chosenDominoNumber = chooseDominoAI(null as any, mockPlayerId);
    expect(chosenDominoNumber).toBeNull();
  });

  it("should return null if playerId is null", () => {
    const domino1: Domino = { number: 1, left: { type: "forest", crowns: 0 }, right: { type: "wheat", crowns: 0 } };
    const availableDominoes: RevealsDomino[] = [ { domino: domino1, picked: false, lordId: null, position: 1 }];
    const gameState = createMockGameState(availableDominoes);
    const chosenDominoNumber = chooseDominoAI(gameState, null as any);
    expect(chosenDominoNumber).toBeNull();
  });
});

describe("placeDominoAI", () => {
  // More detailed mock setup will be needed here
  const mockPlayerId = "aiPlayer2";
  const createMockGameStateForPlacement = (
    playerKingdom: Player["kingdom"],
    pickedDomino: Domino
  ): GameWithNextAction => {
    const aiPlayerResult = createPlayer(mockPlayerId, mockPlayerId, playerKingdom, true);
    if (aiPlayerResult.isErr()) throw new Error("Failed to create AI player for test");
    const aiPlayer = aiPlayerResult.value;

    return {
      id: "game2",
      dominoes: [],
      currentDominoes: [ // Assumes AI has already picked this domino
        { domino: pickedDomino, picked: true, lordId: mockPlayerId, position: 1 }
      ],
      players: [aiPlayer],
      lords: [ // Lord representation of the player
        { id: mockPlayerId, playerId: mockPlayerId, hasPick: true, hasPlace: false, turnEnded: false, dominoPicked: pickedDomino, order: 1}
      ],
      turn: 1,
      nextAction: {
        type: "action",
        nextLord: mockPlayerId,
        nextAction: playerActions.placeDomino,
      },
      rules: { basic: { dominoesPerTurn: 4, maxTurns: 12, kingdomSize: 5 } },
      mode: "Kingdom",
    } as GameWithNextAction;
  };

  it("should find a valid placement if one exists (simple case)", () => {
    const kingdom = placeCastle(createEmptyKingdom());
    const dominoToPlace: Domino = { number: 5, left: { type: "wheat", crowns: 0 }, right: { type: "wheat", crowns: 0 } };
    const gameState = createMockGameStateForPlacement(kingdom, dominoToPlace);

    const placement = placeDominoAI(gameState, mockPlayerId);
    expect(placement).not.toBeNull();
    // Further checks can be added to verify the placement is valid with placeDomino from kingdom.ts
    // For "easy" AI, it's usually the first valid spot.
  });

  it("should return null if no valid placement is possible", () => {
    let kingdom = placeCastle(createEmptyKingdom());
    // Fill the kingdom such that no placement is possible for the given domino
    // This is a bit complex to set up exhaustively, so we'll mock a scenario
    // where placeDomino would always return an error.
    // For a true unit test of placeDominoAI, we might mock placeDomino from kingdom.ts
    // For now, let's assume a domino that cannot be placed anywhere around the castle.
    // e.g. a 7x7 grid full except around castle, and domino needs 2 empty adjacent.
    // A simpler way: a domino that requires adjacency to specific types not present.
    const allSwampKingdom = createEmptyKingdom().map(row =>
      row.map(() => ({ type: "swamp", crowns: 0 }))
    ) as Player["kingdom"];
    allSwampKingdom[4][4] = { type: "castle", crowns: 0}; // castle placement

    const dominoToPlace: Domino = { number: 6, left: { type: "mine", crowns: 1 }, right: { type: "mine", crowns: 1 } };
    // In a full swamp kingdom (except castle), a mine domino cannot be placed if rules require matching types.
    // (Assuming default rules: must touch same type or castle)
    const gameState = createMockGameStateForPlacement(allSwampKingdom, dominoToPlace);

    // To ensure this test is valid, we rely on the known behavior of `placeDomino`
    // which should fail for this setup.
    const placement = placeDominoAI(gameState, mockPlayerId);
    expect(placement).toBeNull();
  });

  it("should return null if game state is not conducive to placement (e.g., not AI's turn, wrong action)", () => {
    const kingdom = placeCastle(createEmptyKingdom());
    const dominoToPlace: Domino = { number: 7, left: { type: "forest", crowns: 0 }, right: { type: "forest", crowns: 0 } };
    const gameState = createMockGameStateForPlacement(kingdom, dominoToPlace);

    const invalidGameState1 = { ...gameState, nextAction: { ...gameState.nextAction, nextLord: "otherPlayer" }};
    let placement = placeDominoAI(invalidGameState1, mockPlayerId);
    // This is not strictly placeDominoAI's role to check, but the use case does.
    // placeDominoAI itself might still find a spot for mockPlayerId's kingdom.
    // The check for `!isGameWithNextAction` or `player.id !== playerId` is done in the use case.
    // placeDominoAI currently doesn't re-check `gameState.nextAction.nextLord === playerId`.
    // It finds the player by playerId and uses their kingdom.
    // Let's refine this: the AI function *is* passed the `playerId`. It should find *that* player.

    const playerForAI = gameState.players.find(p => p.id === mockPlayerId)!;
     const gameStateForOtherPlayerTurn = {
      ...gameState,
      nextAction: {
        type: "action",
        nextLord: "someOtherPlayerId", // Not AI's turn
        nextAction: playerActions.placeDomino,
      }
    } as GameWithNextAction;
    // placeDominoAI will still proceed for mockPlayerId if that player exists, as it's given mockPlayerId
    // The use case layer is responsible for calling it only for the current player.
    // So this test is more about an invalid game state structure passed to AI.

    const noPlayerGameState = { ...gameState, players: [] };
    placement = placeDominoAI(noPlayerGameState, mockPlayerId);
    expect(placement).toBeNull(); // Should fail as player not found

    const noDominoPickedGameState = { ...gameState, currentDominoes: [{domino: dominoToPlace, picked: false, lordId: null, position: 1 }]};
    placement = placeDominoAI(noDominoPickedGameState, mockPlayerId);
    expect(placement).toBeNull(); // Should fail as no domino is picked by the AI player
  });

  it("should return null if gameState is null for placeDominoAI", () => {
    const placement = placeDominoAI(null as any, mockPlayerId);
    expect(placement).toBeNull();
  });

  it("should return null if playerId is null for placeDominoAI", () => {
    const kingdom = placeCastle(createEmptyKingdom());
    const dominoToPlace: Domino = { number: 5, left: { type: "wheat", crowns: 0 }, right: { type: "wheat", crowns: 0 } };
    const gameState = createMockGameStateForPlacement(kingdom, dominoToPlace);
    const placement = placeDominoAI(gameState, null as any);
    expect(placement).toBeNull();
  });

  // TODO: Add more tests for placeDominoAI:
  // - Different kingdom configurations (e.g., edges, corners, filled areas)
  // - Different domino types and rotations
  // - Scenarios where only one specific rotation or position is valid
});
