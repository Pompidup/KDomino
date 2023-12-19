import { get } from "http"
import { Domino } from "../../entities/domino"
import { DominoesRepository } from "../../port/dominoesRepository"

export type GameState = {
    id: string
    dominoes: Domino[]
    currentDominoes: Domino[]
    nextDominoes: Domino[]
    players: Player[]
    kings: King[]
    turn: number
    maxTurns: number
    maxDominoes: number
    dominoesPerTurn: number
}

type GameStateInit = Pick<GameState, 'id' | 'dominoes'>

export type GamesRepository = {
    create: (game: Partial<GameState>) => Promise<void>
    update: (game: Partial<GameState>) => Promise<void>
    get: (id: string) => Promise<GameState | null>
}



export type GameDepencies = {
    dominoesRepository: DominoesRepository
    gamesRepository: GamesRepository
    uuidMethod: () => string
    randomMethod<T>(array: T[]): T[]
}

type King = {
    id: string
    playerId: string
    order: number
}

type Player = {
    id?: string
    name: string
}

type GameSetupPayload = {
    gameId: string
    players: Player[]
}

export const playersAction = ['firstChoice', 'choice', 'pass', 'placeDomino'] as const
type PlayersAction = typeof playersAction[number]

type PlayersActionPayload = {
    gameId: string
    kingId: string
    action: PlayersAction
    data?: any
}

// 2 players => 24 dominoes, 2 kings, 4 dominoes per turn, 6 turns
// 3 players => 36 dominoes, 1 king, 3 dominoes per turn, 12 turns
// 4 players => 48 dominoes, 1 king, 4 dominoes per turn, 12 turns
const rules: {
    [key: number]: {
        kings: number
        maxDominoes: number
        dominoesPerTurn: number
        maxTurns: number
    }
} = {
    2: {
        kings: 2,
        maxDominoes: 24,
        dominoesPerTurn: 4,
        maxTurns: 6
    },
    3: {
        kings: 1,
        maxDominoes: 36,
        dominoesPerTurn: 3,
        maxTurns: 12
    },
    4: {
        kings: 1,
        maxDominoes: 48,
        dominoesPerTurn: 4,
        maxTurns: 12
    }
}

const game = async (dependencies: GameDepencies) => {
    const setState = async (state: Partial<GameState>): Promise<void> => {
        await dependencies.gamesRepository.create(state)
    }

    const updateState = async (state: Partial<GameState>): Promise<void> => {
        await dependencies.gamesRepository.update(state)
    }

    const getState = async (id: string): Promise<GameState> => {
        const state = await dependencies.gamesRepository.get(id)

        if (!state) {
            throw new Error('Game not found')
        }

        return state
    }

    const init = async (dependencies: GameDepencies): Promise<GameStateInit> => {
        const dominoes = await dependencies.dominoesRepository.getAll()
        const id = dependencies.uuidMethod()

        const state = {
            id,
            dominoes
        }

        await setState(state)

        return state
    }

    const setup = async (dependencies: GameDepencies) => async (payload: GameSetupPayload): Promise<GameState> => {
        const { players, gameId } = payload

        if (!players) {
            throw new Error('There must be at least 2 players')
        }

        if (players.length > 4) {
            throw new Error('There must be no more than 4 players')
        }

        if (players.length < 2) {
            throw new Error('There must be at least 2 players')
        }

        const { dominoes } = await getState(gameId)
        const { randomMethod, uuidMethod } = dependencies
        const { maxDominoes, dominoesPerTurn, maxTurns } = rules[players.length]
        const shuffledDominoes = randomMethod(dominoes!)
        shuffledDominoes.splice(maxDominoes)
        const currentDominoes = shuffledDominoes.splice(0, dominoesPerTurn)
        const nextDominoes = shuffledDominoes.splice(0, dominoesPerTurn)

        const newPlayers = players.map((player) => {
            return {
                ...player,
                id: uuidMethod(),
            }
        })

        let newKings
        if (newPlayers.length === 2) {
            newKings = [
                {
                    id: uuidMethod(),
                    playerId: newPlayers[0].id,
                    order: 1
                },
                {
                    id: uuidMethod(),
                    playerId: newPlayers[0].id,
                    order: 2
                },
                {
                    id: uuidMethod(),
                    playerId: newPlayers[1].id,
                    order: 3
                },
                {
                    id: uuidMethod(),
                    playerId: newPlayers[1].id,
                    order: 4
                }
            ]
        } else {
            newKings = newPlayers.map((player, index) => {
                return {
                    id: uuidMethod(),
                    playerId: player.id,
                    order: index + 1
                }
            })
        }

        const kingsWithOrder = randomMethod(newKings)

        kingsWithOrder.forEach((king, index) => {
            king.order = index + 1
        })

        await updateState({
            id: gameId,
            dominoes: shuffledDominoes,
            currentDominoes,
            nextDominoes,
            players: newPlayers,
            kings: newKings,
            maxTurns,
            maxDominoes,
            dominoesPerTurn
        })

        return getState(gameId)
    }



    const action = async (dependencies: GameDepencies) => async (payload: PlayersActionPayload) => {
        return getState(payload.gameId)
    }

    return {
        getState,
        setState,
        init: await init(dependencies),
        setup: await setup(dependencies),
        action: await action(dependencies),
        // reveal,
        // turn,
        // endTurn,
        // endGame,
    }
}

export default game