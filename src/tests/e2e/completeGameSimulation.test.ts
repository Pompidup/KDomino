// import { createGameEngine } from '../index';
// import { isGameWithNextAction, isGameOver } from '../core/domain/types/game';
// import { ok } from '../core/shared/result';

// describe('Full Game Simulation', () => {
//   it('should simulate a complete 2-player game', () => {
//     const engine = createGameEngine({});
//     const players = ['Alice', 'Bob'];
//     let game;

//     // Create game
//     const createGameResult = engine.createGame({ mode: 'standard' });
//     expect(createGameResult.isOk()).toBe(true);
//     game = createGameResult.unwrap();

//     // Add players
//     const addPlayersResult = engine.addPlayers({ game, players });
//     expect(addPlayersResult.isOk()).toBe(true);
//     game = addPlayersResult.unwrap();

//     // Start game
//     const startGameResult = engine.startGame({ game });
//     expect(startGameResult.isOk()).toBe(true);
//     game = startGameResult.unwrap();

//     // Simulate turns until the game is over
//     while (isGameWithNextAction(game)) {
//       const currentPlayer = game.currentLord;

//       // Choose domino
//       const chooseDominoResult = engine.chooseDomino({
//         game,
//         lordId: currentPlayer,
//         dominoPick: 1, // Always choose the first available domino for simplicity
//       });
//       expect(chooseDominoResult.isOk()).toBe(true);
//       game = chooseDominoResult.unwrap();

//       if (!isGameWithNextAction(game)) break; // Game might end after choosing

//       // Place domino (or discard if can't place)
//       const placeDominoResult = engine.placeDomino({
//         game,
//         lordId: currentPlayer,
//         position: { x: 0, y: 0 }, // Always try to place at (0,0) for simplicity
//         orientation: 'horizontal',
//         rotation: 0,
//       });

//       if (placeDominoResult.isOk()) {
//         game = placeDominoResult.unwrap();
//       } else {
//         // If placement failed, discard the domino
//         const discardDominoResult = engine.discardDomino({
//           game,
//           lordId: currentPlayer,
//         });
//         expect(discardDominoResult.isOk()).toBe(true);
//         game = discardDominoResult.unwrap();
//       }
//     }

//     // Assert that the game is over
//     expect(isGameOver(game)).toBe(true);

//     // Get results
//     const getResultsResult = engine.getResults({ game });
//     expect(getResultsResult.isOk()).toBe(true);
//     const results = getResultsResult.unwrap();

//     // Assert that we have results for both players
//     expect(results.length).toBe(2);
//     expect(results.map(r => r.lordId).sort()).toEqual(players.sort());

//     // Assert that scores are numbers
//     results.forEach(result => {
//       expect(typeof result.score).toBe('number');
//     });

//     // Assert that we have a winner (or a tie)
//     const scores = results.map(r => r.score);
//     const maxScore = Math.max(...scores);
//     const winners = results.filter(r => r.score === maxScore);
//     expect(winners.length).toBeGreaterThanOrEqual(1);

//     console.log('Game Results:', results);
//     console.log('Winner(s):', winners.map(w => w.lordId).join(', '));
//   });
// });
