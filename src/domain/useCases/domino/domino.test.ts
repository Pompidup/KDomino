// import inMemoryDominoes from "../../../adapters/repositories/inMemoryDominoes"
// import dominoesService from "./domino"


// const dependencies = {
//     repo: inMemoryDominoes
//     shuffle: () => { }
// }

// describe('Domino', () => {
//     it('should shuffle dominoes', () => {
//         // Arrange
//         const dominoes = await dependencies.repo().getAll()
//         const useCases = dominoesService(dependencies)

//         // Act
//         const shuffleDominoes = useCases.shuffle(dominoes)

//         // Assert
//         expect(shuffleDominoes).not.toEqual(dominoes)
//         expect(shuffleDominoes[0]).toEqual({
//             "left": {
//                 "type": "wheat",
//                 "crown": 0
//             },
//             "right": {
//                 "type": "mine",
//                 "crown": 3
//             },
//             "number": 48
//         })
//     })
// })

// import { createStateMachine, GameConfig, GameState } from './domino'

// describe('createStateMachine', () => {
//   const initialState: GameState = {
//     players: [],
//     turn: 0,
//     data: {}
//   }

//   const stepConfigs: GameConfig['steps'] = [
//     {
//       name: 'step1',
//       functions: {
//         step1: (state) => {
//           // Perform some state transition logic here
//           return state
//         }
//       }
//     },
//     {
//       name: 'step2',
//       functions: {
//         step2: (state) => {
//           // Perform some state transition logic here
//           return state
//         }
//       }
//     }
//   ]

//   it('should transition to the next state', () => {
//     const stateMachine = createStateMachine(initialState, stepConfigs)

//     // Perform a transition to the next state
//     const nextStateMachine = stateMachine.transition('step1')

//     // Assert that the current state has changed
//     expect(nextStateMachine.currentState).not.toBe(stateMachine.currentState)
//   })

//   it('should throw an error for an invalid step name', () => {
//     const stateMachine = createStateMachine(initialState, stepConfigs)

//     // Attempt to transition to an invalid step name
//     expect(() => {
//       stateMachine.transition('invalidStep')
//     }).toThrowError('Step invalidStep not found')
//   })

//   it('should throw an error for a missing step function', () => {
//     const stateMachine = createStateMachine(initialState, stepConfigs)

//     // Attempt to transition to a step with a missing function
//     expect(() => {
//       stateMachine.transition('step2')
//     }).toThrowError('Step function step2 not found')
//   })
// })