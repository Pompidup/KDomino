import inMemoryDominoes from "../../../adapters/repositories/inMemoryDominoes"
import game, { GameDepencies, GameState, GamesRepository } from "./game"


const inMemoryGamesRepository = (initialGameState?: GameState): GamesRepository => {
    const games: Partial<GameState>[] = initialGameState ? [initialGameState] : []

    return {
        create: async (game) => {
            games.push(game)
        },
        update: async (game) => {
            const currentGame = games.find((g) => g.id === game.id)
            if (!currentGame) {
                throw new Error(`Game ${game.id} not found`)
            }

            const updatedGame = { ...currentGame, ...game }
            const index = games.indexOf(currentGame)
            games[index] = updatedGame
        },
        get: async (id) => {
            const currentGame = games.find((g) => g.id === id)
            if (!currentGame) {
                return null
            }
            
            return currentGame as GameState
        }
    }
}
describe('game', () => {
    const dependencies: GameDepencies = {
        dominoesRepository: inMemoryDominoes(),
        gamesRepository: inMemoryGamesRepository(),
        uuidMethod: () => `uuid-${Math.random()}`,
        randomMethod: (array) => array
    }


    describe('init', () => {
        it('should load dominoes and create game', async () => {
            // Arrange
            const useCases = await game(dependencies)

            // Act
            const state = useCases.init

            // Assert
            expect(state.dominoes?.length).toEqual(48)
            expect(state.id).toEqual(expect.stringContaining('uuid-'))
        })
    })

    describe('setup', () => {
        it('should add two players to the game', async () => {
            // Arrange
            const id = `uuid-${Math.random()}`
            const deps: GameDepencies = {
                dominoesRepository: inMemoryDominoes(),
                gamesRepository: inMemoryGamesRepository({
                    id,
                    dominoes: await inMemoryDominoes().getAll(),
                    currentDominoes: [],
                    nextDominoes: [],
                    players: [],
                    kings: [],
                    turn: 0,
                    maxTurns: 0,
                    maxDominoes: 0,
                    dominoesPerTurn: 0
                }),
                uuidMethod: () => `uuid-${Math.random()}`,
                randomMethod: (array) => array
            }

            const useCases = await game(deps)

            const payload = {
                gameId: id,
                players: [{ name: 'Player 1' }, { name: 'Player 2' }]
            }

            // Act
            const state = await useCases.setup(payload)

            // Assert
            expect(state.players.length).toEqual(2)
        })

        it('should throw an error if there are less than 2 players', async () => {
            // Arrange
            const id = `uuid-${Math.random()}`
            const deps: GameDepencies = {
                dominoesRepository: inMemoryDominoes(),
                gamesRepository: inMemoryGamesRepository({
                    id,
                    dominoes: await inMemoryDominoes().getAll(),
                    currentDominoes: [],
                    nextDominoes: [],
                    players: [],
                    kings: [],
                    turn: 0,
                    maxTurns: 0,
                    maxDominoes: 0,
                    dominoesPerTurn: 0
                }),
                uuidMethod: () => `uuid-${Math.random()}`,
                randomMethod: (array) => array
            }

            const useCases = await game(deps)

            const payload = {
                gameId: id,
                players: [{ name: 'Player 1' }]
            }

            // Act
            const setup = useCases.setup(payload)

            // Assert
            await expect(setup).rejects.toThrow('There must be at least 2 players')
        })

        it('should define rules for 2 players', async () => {
            // Arrange
            const id = `uuid-${Math.random()}`
            const deps: GameDepencies = {
                dominoesRepository: inMemoryDominoes(),
                gamesRepository: inMemoryGamesRepository({
                    id,
                    dominoes: await inMemoryDominoes().getAll(),
                    currentDominoes: [],
                    nextDominoes: [],
                    players: [],
                    kings: [],
                    turn: 0,
                    maxTurns: 0,
                    maxDominoes: 0,
                    dominoesPerTurn: 0
                }),
                uuidMethod: () => `uuid-${Math.random()}`,
                randomMethod: (array) => array
            }

            const useCases = await game(deps)

            const payload = {
                gameId: id,
                players: [{ name: 'Player 1' }, { name: 'Player 2' }]
            }

            // Act
            const state = await useCases.setup(payload)

            //console.log(state.dominoes)
            // Assert
            expect(state.maxDominoes).toEqual(24)
            expect(state.dominoes.length).toEqual(16)
            expect(state.currentDominoes.length).toEqual(4)
            expect(state.nextDominoes.length).toEqual(4)
            expect(state.dominoesPerTurn).toEqual(4)
            expect(state.maxTurns).toEqual(6)
            expect(state.players[0].name).toEqual('Player 1')
            expect(state.players[1].name).toEqual('Player 2')
            expect(state.kings.length).toEqual(4)
        })

        it('should define rules for 3 players', async () => {
            // Arrange
            const id = `uuid-${Math.random()}`
            const deps: GameDepencies = {
                dominoesRepository: inMemoryDominoes(),
                gamesRepository: inMemoryGamesRepository({
                    id,
                    dominoes: await inMemoryDominoes().getAll(),
                    currentDominoes: [],
                    nextDominoes: [],
                    players: [],
                    kings: [],
                    turn: 0,
                    maxTurns: 0,
                    maxDominoes: 0,
                    dominoesPerTurn: 0
                }),
                uuidMethod: () => `uuid-${Math.random()}`,
                randomMethod: (array) => array
            }

            const useCases = await game(deps)

            const payload = {
                gameId: id,
                players: [{ name: 'Player 1' }, { name: 'Player 2' }, { name: 'Player 3' }]
            }

            // Act
            const state = await useCases.setup(payload)

            // Assert
            expect(state.maxDominoes).toEqual(36)
            expect(state.dominoes.length).toEqual(30)
            expect(state.dominoesPerTurn).toEqual(3)
            expect(state.maxTurns).toEqual(12)
            expect(state.players[0].name).toEqual('Player 1')
            expect(state.players[1].name).toEqual('Player 2')
            expect(state.players[2].name).toEqual('Player 3')
            expect(state.kings.length).toEqual(3)
        })

        it('should define rules for 4 players', async () => {
            // Arrange
            const id = `uuid-${Math.random()}`
            const deps: GameDepencies = {
                dominoesRepository: inMemoryDominoes(),
                gamesRepository: inMemoryGamesRepository({
                    id,
                    dominoes: await inMemoryDominoes().getAll(),
                    currentDominoes: [],
                    nextDominoes: [],
                    players: [],
                    kings: [],
                    turn: 0,
                    maxTurns: 0,
                    maxDominoes: 0,
                    dominoesPerTurn: 0
                }),
                uuidMethod: () => `uuid-${Math.random()}`,
                randomMethod: (array) => array
            }

            const useCases = await game(deps)

            const payload = {
                gameId: id,
                players: [{ name: 'Player 1' }, { name: 'Player 2' }, { name: 'Player 3' }, { name: 'Player 4' }]
            }

            // Act
            const state = await useCases.setup(payload)

            // Assert
            expect(state.maxDominoes).toEqual(48)
            expect(state.dominoes.length).toEqual(40)
            expect(state.dominoesPerTurn).toEqual(4)
            expect(state.maxTurns).toEqual(12)
            expect(state.players[0].name).toEqual('Player 1')
            expect(state.players[1].name).toEqual('Player 2')
            expect(state.players[2].name).toEqual('Player 3')
            expect(state.players[3].name).toEqual('Player 4')
            expect(state.kings.length).toEqual(4)
        })

        it('should shuffle dominoes', async () => {
            // Arrange
            const id = `uuid-${Math.random()}`
            const deps: GameDepencies = {
                dominoesRepository: inMemoryDominoes(),
                gamesRepository: inMemoryGamesRepository({
                    id,
                    dominoes: await inMemoryDominoes().getAll(),
                    currentDominoes: [],
                    nextDominoes: [],
                    players: [],
                    kings: [],
                    turn: 0,
                    maxTurns: 0,
                    maxDominoes: 0,
                    dominoesPerTurn: 0
                }),
                randomMethod: (array) => [...array].reverse(),
                uuidMethod: () => `uuid-${Math.random()}`
            }

            const useCases = await game(deps)

            const payload = {
                gameId: id,
                players: [{ name: 'Player 1' }, { name: 'Player 2' }, { name: 'Player 3' }, { name: 'Player 4' }]
            }

            // Act
            const state = await useCases.setup(payload)

            // Assert
            expect(state.dominoes[0]).toEqual(    {
                "left": {
                    "type": "mine",
                    "crowns": 1
                },
                "right": {
                    "type": "wheat",
                    "crowns": 0
                },
                "number": 40
            })
        })

        it('should setup players kings', async () => {
            // Arrange
            const id = `uuid-${Math.random()}`
            const deps: GameDepencies = {
                dominoesRepository: inMemoryDominoes(),
                gamesRepository: inMemoryGamesRepository({
                    id,
                    dominoes: await inMemoryDominoes().getAll(),
                    currentDominoes: [],
                    nextDominoes: [],
                    players: [],
                    kings: [],
                    turn: 0,
                    maxTurns: 0,
                    maxDominoes: 0,
                    dominoesPerTurn: 0
                }),
                uuidMethod: () => `uuid-${Math.random()}`,
                randomMethod: (array) => array
            }

            const useCases = await game(deps)

            const payload = {
                gameId: id,
                players: [{ name: 'Player 1' }, { name: 'Player 2' }]
            }

            // Act
            const state = await useCases.setup(payload)

            // Assert
            expect(state.kings[0].playerId).toEqual(state.players[0].id)
            expect(state.kings[1].playerId).toEqual(state.players[0].id)
            expect(state.kings[2].playerId).toEqual(state.players[1].id)
            expect(state.kings[3].playerId).toEqual(state.players[1].id)
        })

        it('should random kings order for 2 players', async () => {
            // Arrange
            const id = `uuid-${Math.random()}`
            const deps: GameDepencies = {
                dominoesRepository: inMemoryDominoes(),
                gamesRepository: inMemoryGamesRepository({
                    id,
                    dominoes: await inMemoryDominoes().getAll(),
                    currentDominoes: [],
                    nextDominoes: [],
                    players: [],
                    kings: [],
                    turn: 0,
                    maxTurns: 0,
                    maxDominoes: 0,
                    dominoesPerTurn: 0
                }),
                uuidMethod: () => `uuid-${Math.random()}`,
                randomMethod: (array) => [...array].reverse()
            }

            const useCases = await game(deps)

            const payload = {
                gameId: id,
                players: [{ name: 'Player 1' }, { name: 'Player 2' }]
            }

            // Act
            const state = await useCases.setup(payload)

            // Assert
            expect(state.kings[0].order).toEqual(4)
            expect(state.kings[1].order).toEqual(3)
            expect(state.kings[2].order).toEqual(2)
            expect(state.kings[3].order).toEqual(1)
        })

        it('should random kings order for 3 players', async () => {
            // Arrange
            const id = `uuid-${Math.random()}`
            const deps: GameDepencies = {
                dominoesRepository: inMemoryDominoes(),
                gamesRepository: inMemoryGamesRepository({
                    id,
                    dominoes: await inMemoryDominoes().getAll(),
                    currentDominoes: [],
                    nextDominoes: [],
                    players: [],
                    kings: [],
                    turn: 0,
                    maxTurns: 0,
                    maxDominoes: 0,
                    dominoesPerTurn: 0
                }),
                uuidMethod: () => `uuid-${Math.random()}`,
                randomMethod: (array) => [...array].reverse()
            }

            const useCases = await game(deps)

            const payload = {
                gameId: id,
                players: [{ name: 'Player 1' }, { name: 'Player 2' }, { name: 'Player 3' }]
            }

            // Act
            const state = await useCases.setup(payload)

            // Assert
            expect(state.kings[0].order).toEqual(3)
            expect(state.kings[1].order).toEqual(2)
            expect(state.kings[2].order).toEqual(1)
        })
    })

    // describe('firstChoice', () => {
    //     it('should save player first choice', async () => {
    //         // Arrange
    //         const id = `uuid-${Math.random()}`
    //         const allDominoes = await inMemoryDominoes().getAll()
    //         allDominoes.splice(0, 24)
    //         const currentDominoes = allDominoes.splice(0, 4)
    //         const nextDominoes = allDominoes.splice(0, 4)
    //         const state = {
    //             id,
    //             dominoes: allDominoes,
    //             currentDominoes,
    //             nextDominoes,
    //             players: [
    //                 { id: 'uuid-1', name: 'Player 1' },
    //                 { id: 'uuid-2', name: 'Player 2' }
    //             ],
    //             kings: [
    //                 { id: 'uuid-1', playerId: 'uuid-1', order: 1 },
    //                 { id: 'uuid-2', playerId: 'uuid-1', order: 2 },
    //                 { id: 'uuid-3', playerId: 'uuid-2', order: 3 },
    //                 { id: 'uuid-4', playerId: 'uuid-2', order: 4 }
    //             ],
    //             turn: 1,
    //             maxTurns: 12,
    //             maxDominoes: 24,
    //             dominoesPerTurn: 4
    //         }

    //         const deps: GameDepencies = {
    //             dominoesRepository: inMemoryDominoes(),
    //             gamesRepository: inMemoryGamesRepository(state),
    //             uuidMethod: () => `uuid-${Math.random()}`,
    //             randomMethod: (array) => array
    //         }

    //         const useCases = await game(deps)

    //         const payload = {
    //             gameId: id,
    //             playerId: 'uuid-1',
    //             kingId: 'uuid-1',
    //             action: {
    //                 type: 'firstChoice',
    //                 dominoNumber: 1
    //             }
    //         }

    //         // Act
    //         const newState = useCases.action(payload)

    //         // Assert
      
    //     })

    // })
})

