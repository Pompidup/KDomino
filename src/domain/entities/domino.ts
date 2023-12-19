const ground =  ['wheat', 'forest', 'sea', 'plain', 'swamp', 'mine'] as const
export type Ground = typeof ground[number]

export type Tile = {
    type: Ground
    crowns: number
}

export type Domino = {
    left: Tile
    right: Tile
    number: number
}

// Each domino has two tiles
// Each tile has a type and a number of crowns
// Each domino has a cost
// Cost is unique for all collection of dominos
// Cost is more elevated if the combination of tiles is more powerful
