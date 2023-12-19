import dominoes from '../../../data/dominoes.json'
import { Domino, Ground } from '../../entities/domino'

const getAll = async (): Promise<Domino[]> => {
    const allDominoes: Domino[] = []
    dominoes.forEach((domino) => {
        allDominoes.push({
            left: {
                type: <Ground>domino.left.type,
                crowns: domino.left.crowns
            },
            right: {
                type: <Ground>domino.right.type,
                crowns: domino.right.crowns
            },
            number: domino.number
        })
    })


    return allDominoes
}

export default getAll
