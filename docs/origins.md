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

**Totems**: 4 totem tiles (one per resource type). Player with the majority of a resource type holds that totem.

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
| Neolithic | The Mighty Duel | 7×7 kingdom, 2 players |
| Dynasty | Dynasty | Play 3 games, sum points |

## Turn Flow

### Discovery / Totem Mode
```
placeDomino → [placeFireToken if volcano] → pickDomino
```

### Tribe Mode
```
placeDomino → [placeFireToken if volcano] → pickDomino → [recruitCaveman optional]
```

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
