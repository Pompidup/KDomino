// import { Domino } from "../../entities/domino"
// import { DominoesRepository } from "../../port/dominoesRepository"

// type DominoesServiceDependencies = {
//   dominoesRepository: DominoesRepository
//   randMethod: () => number
// }

// const shuffle = (dominoes: Domino[]): Domino[] => {
// }

// const pick = (dominoes: Domino[], number: number): Domino[] => {
// }

// const dominoesService = (dependencies: DominoesServiceDependencies) => {
//   const { dominoesRepository, randMethod } = dependencies
//   return {
//     shuffle: (dominoes: Domino[], randMethod): Domino[] => {
//       return shuffle(dominoes)
//     },

//     pick: (dominoes: Domino[], number: number): Domino[] => {
//       return pick(dominoes, number)
//     },
//   }
// }


// export default dominoesService

// // persist in the game state
// // optionally in db for save/load

// // Step 1: Init => Load dominoes
// // Step 2: Setup => Add players, define max dominoes, define max turns, define dominoesPerTurn, shuffle dominoes, choose random players order, pick dominoesPerTurn and order by asc number
// // Step 3: FirstChoice => Define player order
// // Step 4: Reveal => Pick next dominoesPerTurn
// // Step 5: Turn => Player add dominoes to the board, player choose to pass or play, player choose next domino, repeat this step for each player
// // Step 6: EndTurn => If max turns reached, go to step 7, else go to step 4
// // Step 7: EndGame => Calculate score, declare winner

// // type Player = {
// //     id: number
// //     name: string
// //     board: Domino[][]
// // }

// // type Step = 'Init' | 'Setup' | 'FirstChoice' | 'Reveal' | 'Turn' | 'EndTurn' | 'EndGame'

// // type Transition = {
// //     from: Step
// //     to: Step
// // }

// // export type GameState = {
// //     players: Player[]
// //     turn: number
// //     maxTurns: number
// //     maxDominoes: number
// //     dominoesPerTurn: number
// //     playerOrder: number[]
// //     revealedDominoes: Domino[]
// // }

// // type GameStepFunctions = (state: GameState) => GameState

// // type GameStepConfig = {
// //     name: Step
// //     functions: GameStepFunctions
// // }

// // export type GameConfig = {
// //     initialState: GameState
// //     steps: GameStepConfig[]
// //     transitions: Transition[]
// // }

// // const initialGameState: GameState = {
// //     players: [],
// //     turn: 0,
// //     maxTurns: 0,
// //     maxDominoes: 0,
// //     dominoesPerTurn: 0,
// //     playerOrder: [],
// //     revealedDominoes: [],
// // }

// // const initStep: GameStepFunctions = (state) => {
// //     // Implement your logic for the 'Init' step
// //     return state
// // }

// // const setupStep: GameStepFunctions = (state) => {
// //     // Implement your logic for the 'Setup' step
// //     return state
// // }

// // const firstChoiceStep: GameStepFunctions = (state) => {
// //     // Implement your logic for the 'FirstChoice' step
// //     return state
// // }

// // // Define functions for other steps as needed

// // const gameSteps: GameStepConfig[] = [
// //     { name: 'Init', functions: initStep },
// //     { name: 'Setup', functions: setupStep },
// //     { name: 'FirstChoice', functions: firstChoiceStep },
// //     // Add other steps
// // ]

// // const gameTransitions: Transition[] = [
// //     { from: <Step>'Init', to: <Step>'Setup' },
// //     { from: <Step>'Setup', to: <Step>'FirstChoice' },
// //     // Add other transitions
// // ]

// // const gameConfig: GameConfig = {
// //     initialState: initialGameState,
// //     steps: gameSteps,
// //     transitions: gameTransitions,
// // }

// // const createStateMachine = (initialState: GameState, steps: GameStepConfig[], transitions: Transition[], config: GameConfig) => {

// //     const nextStep = (currentStep: Step): Step => {
// //         const transition = transitions.find(({ from }) => from === currentStep)
// //         if (!transition) {
// //             throw new Error(`Transition from ${currentStep} not found`)
// //         }

// //         return transition.to
// //     }

// //     const executeStep = (step: Step, state: GameState): GameState => {
// //         const currentStep = steps.find(({ name }) => name === step)
// //         if (!currentStep) {
// //             throw new Error(`Step ${step} not found`)
// //         }

// //         return currentStep.functions(state)
// //     }

// //     return {
// //         currentState: initialState,
// //         steps,
// //         transitions,
// //         config,
// //         nextStep,
// //         executeStep,
// //     }
// // }

// // const stateMachine = createStateMachine(initialGameState, gameSteps, gameTransitions, gameConfig)

// // stateMachine.executeStep('Init', initialGameState)
// // stateMachine.executeStep('Setup', initialGameState)
// // stateMachine.executeStep('FirstChoice', initialGameState)



// type State<T> = {
//   name: string;
//   transitions: Record<string, string>;
//   onEntry?: (context: any, payload?: T) => void;
//   onExit?: (context: any, payload?: T) => void;
// };

// type StateMachine = {
//   currentState: State;
//   states: Record<string, State>;
//   context: any;
// };

// // Fonction pour créer une machine à états avec un état initial et des états définis
// function createStateMachine(initialState: string, states: Record<string, State>): StateMachine {
//   return {
//     currentState: states[initialState],
//     states,
//     context: {},
//   };
// }

// // Fonction pour envoyer un événement à la machine à états avec des paramètres supplémentaires
// function sendEvent(machine: StateMachine, event: string, payload?: any): void {
//   const nextStateName = machine.currentState.transitions[event];
//   const nextState = machine.states[nextStateName];

//   if (!nextState) {
//     console.error(`Invalid transition from state ${machine.currentState.name} with event ${event}`);
//     return;
//   }

//   if (machine.currentState.onExit) {
//     machine.currentState.onExit(machine.context, payload);
//   }

//   machine.currentState = nextState;

//   if (machine.currentState.onEntry) {
//     machine.currentState.onEntry(machine.context, payload);
//   }
// }

// // Exemple d'utilisation avec un payload
// const gameStates: Record<string, State> = {
//   waitingForPlayer: {
//     name: 'waitingForPlayer',
//     transitions: {
//       PLAYER_ACTION: 'processingAction',
//     },
//     onEntry: (context, payload) => {
//       console.log('Entering waitingForPlayer state with payload:', payload);
//     },
//     onExit: (context, payload) => {
//       console.log('Exiting waitingForPlayer state with payload:', payload);
//     },
//   },
//   processingAction: {
//     name: 'processingAction',
//     transitions: {
//       NEXT_STEP: 'nextStep',
//     },
//     onEntry: (context, payload) => {
//       console.log('Entering processingAction state with payload:', payload);
//     },
//     onExit: (context, payload) => {
//       console.log('Exiting processingAction state with payload:', payload);
//     },
//   },
//   nextStep: {
//     name: 'nextStep',
//     transitions: {},
//     onEntry: (context, payload) => {
//       console.log('Entering nextStep state with payload:', payload);
//     },
//     onExit: (context, payload) => {
//       console.log('Exiting nextStep state with payload:', payload);
//     },
//   },
// };

// const gameMachine = createStateMachine('waitingForPlayer', gameStates);

// // Envoyer un événement pour déclencher une transition avec un payload
// const playerActions = { /* votre objet d'actions de joueur ici */ };
// sendEvent(gameMachine, 'PLAYER_ACTION', playerActions);



