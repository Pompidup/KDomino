# Kingdomino Origins

Kingdomino Origins is an official expansion that introduces 3 gameplay modes set in prehistoric times. Each mode builds upon the previous one, adding new mechanics.

## Modes

### Discovery Mode (`KingdominoOrigins-Discovery`)

The base Origins mode. Replaces classic terrains with prehistoric ones and introduces **volcanoes** and **fire tokens**.

**New Terrains**: grassland, lake, jungle, quarry, desert, volcano

**Fire Mechanics**:
- Volcanoes provide fire tokens when placed (1/2/3 fires based on volcanic craters)
- Fire tokens are placed on the kingdom, traveling N squares from the volcano (8-directional, direction changes allowed)
- **Scoring**: region size × fire symbols (printed on tiles + fire tokens in the region)
- Volcano regions score 0 (no fire symbols)

**Fire Token Pool**: 5×1-fire, 4×2-fire, 1×3-fire (10 total per game)

### Totem Mode (`KingdominoOrigins-Totem`)

Extends Discovery with **wooden resources** and **totem majority** tiles.

**Resources**: Placed on tiles when dominos are placed in the kingdom.
- grassland → mammoth, lake → fish, jungle → mushroom, quarry → flint
- Tiles with fire symbols get NO resource
- Fire tokens landing on a resource destroy it

**Totems**: 4 totem tiles (one per resource type), held by the player with the majority of that resource. Holders are re-evaluated during the game, after every `placeDomino` (new resources) and `placeFireToken` (destroyed resource), and once more by `getResults`:
- a player takes a totem when they have **strictly more** resources of that type than every other player, taking it from its holder if needed;
- on a tie for the majority, the current holder keeps the totem; if the holder lost the majority to several tied players, the totem goes to the first of them (player order);
- a totem nobody holds stays unclaimed while the majority is tied, and returns to unclaimed when nobody has the resource anymore.

`game.origins.totems` always reflects the current holders.

**Scoring**: Discovery scoring + 1 point per remaining resource + totem bonuses (3 pts each)

### Tribe Mode (`KingdominoOrigins-Tribe`)

Extends Discovery with **resources** (like Totem) and a **cave board** for recruiting **cavemen**.

**Cave Board**: 22 caveman tiles (4 visible + draw pile), refilled when taken.

**Recruitment** (optional, after picking a new domino):
- Spend 2 different resources → recruit from visible cavemen
- Spend 4 different resources → recruit from draw pile
- Place caveman on a square with no fire symbol, fire token, or resource

**Cavemen Types**:
- **14 Hunter-Gatherers** (7 kinds × 2): score based on surrounding resources (8 directions)
  - mammothHunter, fisherman, mushroomPicker, flintCollector: 3 pts per matching adjacent resource
  - trapper: 2 pts per unique adjacent resource type
  - gatherer: 1 pt per adjacent resource (any type)
  - fireLady: 1 pt per adjacent fire symbol
- **8 Warriors**: small (power 1) × 4, amazon (power 2) × 3, oafish (power 3) × 1
  - Connected warrior groups score: group_size × total_power

**Scoring**: Discovery scoring + caveman bonuses (NO resource points, NO totems)

## Extra Rules (Origins equivalents)

| Origins Rule | Classic Equivalent | Effect |
|---|---|---|
| Empire of Fire | The middle Kingdom | +10 pts if castle in center |
| Homo Habilis | Harmony | +5 pts if kingdom complete |
| Neolithic | The Mighty Duel | 7×7 kingdom, 2 players, pair choice (see below) |
| Dynasty | Dynasty | Play 3 games, sum points |

### Neolithic (2 players)

Neolithic uses all 48 dominoes, 12 turns and a 7×7 territory, each player having 2 tribe chiefs. The rulebook adds (Special two player rules, *During Turns*): "the player whose chief was drawn first chooses to take dominos 1 and 4 OR 2 and 3 (in the column, from the top). The other player takes the 2 remaining dominoes."

The engine applies this pair choice to **every line** of 4 dominoes, through the regular `chooseDomino`:

1. The first lord to pick in the line chooses the pair with its own pick: the domino at `position` 1 or 4 takes the pair 1 & 4, position 2 or 3 the pair 2 & 3 (positions follow the sorted line, 1 = lowest number).
2. The whole line is reserved (`RevealsDomino.reservedFor`): the pair for that lord's player, the two other dominoes for the opponent (`onNeolithicPairChosen` event).
3. Each lord then picks, in the usual order (Tribe: with its `recruitCaveman` after each pick), one of the dominoes reserved for its player. A domino reserved for the other player is refused with `DOMINO_RESERVED`.

```typescript
// Dominoes the lord to play may pick (pair choice included)
const picks = engine.getValidDominoPicks({ game });
game = engine.chooseDomino({ game, lordId: game.nextAction.nextLord, dominoPick: picks[0] });
```

The bots only consider these dominoes, and the action log replays the reservations identically.

## Turn Flow

### Discovery / Totem Mode
```
placeDomino → [placeFireToken if volcano] → pickDomino
```

### Tribe Mode
```
placeDomino → [placeFireToken if volcano] → pickDomino → [recruitCaveman optional]
```

Recruiting does not change the turn order: when the lord that completes a round recruits, the next round starts normally and that lord still places and picks in it.

### Last turn
During the last turn there is no domino left to pick: each lord only places (or discards) its domino, and places its fire token if it placed a volcano. The `result` step is reached only once **every** lord has played its last domino.

## API

### New Engine Methods

```typescript
// Place a fire token after placing a volcano domino
engine.placeFireToken({ game, lordId, position })

// Recruit a caveman from the cave board (Tribe mode)
engine.recruitCaveman({ game, lordId, cavemanId, position, resourcePositions })

// Skip any optional action (shared with Queendomino)
engine.skipOptionalAction({ game, lordId })
```

### New Player Actions

- `placeFireToken` - Place fire token on kingdom (Origins)
- `recruitCaveman` - Recruit caveman from cave board (Tribe)

### Game State

```typescript
game.origins?: {
  subMode: "Discovery" | "Totem" | "Tribe";
  fireTokenPool: { ones: number; twos: number; threes: number };
  pendingFireToken?: { fires: 1 | 2 | 3; volcanoPosition: Position };
  totems?: Record<ResourceType, string | null>;  // Totem mode
  caveBoard?: { visible: CavemanTile[]; drawPile: CavemanTile[] };  // Tribe mode
}
```

### Player State (Origins fields)

```typescript
player.fireTokens?: PlacedFireToken[];   // All modes
player.resources?: Resource[];            // Totem & Tribe
player.cavemen?: PlacedCaveman[];         // Tribe only
```
