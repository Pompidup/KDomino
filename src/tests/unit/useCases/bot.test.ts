import {
  createEmptyKingdom,
  placeCastle,
} from "@core/domain/entities/kingdom.js";
import type { Domino, RevealsDomino } from "@core/domain/types/domino.js";
import type {
  GameWithNextAction,
  NextAction,
} from "@core/domain/types/game.js";
import {
  advancedStrategy,
  expertStrategy,
  greedyStrategy,
  isBotTurn,
  type PickContext,
  type PlaceContext,
  playBotTurn,
  randomStrategy,
} from "@core/useCases/bot.js";
import type { ValidPlacement } from "@core/useCases/getValidPlacements.js";
import { describe, expect, test, vi } from "vitest";
import { createGameBuilder } from "../../builder/game.js";
import { createLordBuilder } from "../../builder/lord.js";
import { createPlayerBuilder } from "../../builder/player.js";

// ─── Test Fixtures ───────────────────────────────────────────────────

const wheatDomino: Domino = {
  left: { type: "wheat", crowns: 0 },
  right: { type: "wheat", crowns: 0 },
  number: 1,
};

const crownedDomino: Domino = {
  left: { type: "wheat", crowns: 2 },
  right: { type: "wheat", crowns: 0 },
  number: 2,
};

const forestDomino: Domino = {
  left: { type: "forest", crowns: 1 },
  right: { type: "forest", crowns: 0 },
  number: 3,
};

const makeRevealsDomino = (
  domino: Domino,
  position: number,
): RevealsDomino => ({
  domino,
  picked: false,
  lordId: null,
  position,
});

const emptyKingdomWithCastle = () => placeCastle(createEmptyKingdom());

const validPlacementsNearCastle: ValidPlacement[] = [
  { position: { x: 3, y: 4 }, rotation: 0 }, // left of castle
  { position: { x: 5, y: 4 }, rotation: 0 }, // right of castle
  { position: { x: 4, y: 3 }, rotation: 0 }, // above castle
];

const makePickContext = (
  availableDominoes: RevealsDomino[],
  overrides?: Partial<PickContext>,
): PickContext => {
  const kingdom = emptyKingdomWithCastle();
  const lord = createLordBuilder()
    .withId("lord1-id")
    .withPlayerId("player1-id")
    .withHasPick(false)
    .build();
  const player = createPlayerBuilder()
    .withId("player1-id")
    .withName("Alice")
    .withKingdom(kingdom)
    .build();

  const actionPick: NextAction = {
    type: "action",
    nextLord: "lord1-id",
    nextAction: "pickDomino",
  };

  const game = createGameBuilder()
    .withAllDefaults()
    .withPlayers([player])
    .withLords([lord])
    .withCurrentDominoes(availableDominoes)
    .withNextAction(actionPick)
    .withTurn(1)
    .build();

  return {
    game,
    lordId: "lord1-id",
    availableDominoes,
    ...overrides,
  };
};

const makePlaceContext = (
  domino: Domino,
  placements: ValidPlacement[],
  overrides?: Partial<PlaceContext>,
): PlaceContext => {
  const kingdom = emptyKingdomWithCastle();
  const lord = createLordBuilder()
    .withId("lord1-id")
    .withPlayerId("player1-id")
    .withDominoPicked(domino)
    .build();
  const player = createPlayerBuilder()
    .withId("player1-id")
    .withName("Alice")
    .withKingdom(kingdom)
    .build();

  const actionPlace: NextAction = {
    type: "action",
    nextLord: "lord1-id",
    nextAction: "placeDomino",
  };

  const game = createGameBuilder()
    .withAllDefaults()
    .withPlayers([player])
    .withLords([lord])
    .withNextAction(actionPlace)
    .withTurn(1)
    .build();

  return {
    game,
    lordId: "lord1-id",
    domino,
    kingdom,
    validPlacements: placements,
    ...overrides,
  };
};

// ─── randomStrategy ──────────────────────────────────────────────────

describe("randomStrategy", () => {
  describe("chooseDomino", () => {
    test("should return a domino number from available dominoes", () => {
      const available = [
        makeRevealsDomino(wheatDomino, 1),
        makeRevealsDomino(crownedDomino, 2),
      ];
      const ctx = makePickContext(available);
      const pick = randomStrategy.chooseDomino(ctx);

      const validNumbers = available.map((d) => d.domino.number);
      expect(validNumbers).toContain(pick);
    });
  });

  describe("choosePlacement", () => {
    test("should return a valid placement", () => {
      const ctx = makePlaceContext(wheatDomino, validPlacementsNearCastle);
      const placement = randomStrategy.choosePlacement(ctx);

      expect(placement).not.toBeNull();
      expect(validPlacementsNearCastle).toContainEqual(placement);
    });

    test("should return null when no placements available", () => {
      const ctx = makePlaceContext(wheatDomino, []);
      const placement = randomStrategy.choosePlacement(ctx);

      expect(placement).toBeNull();
    });
  });
});

// ─── greedyStrategy ──────────────────────────────────────────────────

describe("greedyStrategy", () => {
  describe("choosePlacement", () => {
    test("should choose the placement that maximizes score", () => {
      const ctx = makePlaceContext(crownedDomino, validPlacementsNearCastle);
      const placement = greedyStrategy.choosePlacement(ctx);

      expect(placement).not.toBeNull();
      expect(validPlacementsNearCastle).toContainEqual(placement);
    });

    test("should return null when no placements available", () => {
      const ctx = makePlaceContext(wheatDomino, []);
      const placement = greedyStrategy.choosePlacement(ctx);

      expect(placement).toBeNull();
    });
  });

  describe("chooseDomino", () => {
    test("should prefer a domino with crowns over one without", () => {
      const available = [
        makeRevealsDomino(wheatDomino, 1),
        makeRevealsDomino(crownedDomino, 2),
      ];
      const ctx = makePickContext(available);
      const pick = greedyStrategy.chooseDomino(ctx);

      // Crowned domino should score higher
      expect(pick).toBe(crownedDomino.number);
    });
  });
});

// ─── advancedStrategy ────────────────────────────────────────────────

describe("advancedStrategy", () => {
  describe("choosePlacement", () => {
    test("should return a valid placement", () => {
      const ctx = makePlaceContext(wheatDomino, validPlacementsNearCastle);
      const placement = advancedStrategy.choosePlacement(ctx);

      expect(placement).not.toBeNull();
      expect(validPlacementsNearCastle).toContainEqual(placement);
    });

    test("should return null when no placements available", () => {
      const ctx = makePlaceContext(wheatDomino, []);
      expect(advancedStrategy.choosePlacement(ctx)).toBeNull();
    });
  });

  describe("chooseDomino", () => {
    test("should return a valid domino number", () => {
      const available = [
        makeRevealsDomino(wheatDomino, 1),
        makeRevealsDomino(crownedDomino, 2),
        makeRevealsDomino(forestDomino, 3),
      ];
      const ctx = makePickContext(available);
      const pick = advancedStrategy.chooseDomino(ctx);

      const validNumbers = available.map((d) => d.domino.number);
      expect(validNumbers).toContain(pick);
    });
  });
});

// ─── expertStrategy ──────────────────────────────────────────────────

describe("expertStrategy", () => {
  // Use a near-end game state (turn 5 of 6, few dominoes left) to keep search fast
  const makeExpertPickContext = (
    availableDominoes: RevealsDomino[],
  ): PickContext => {
    const kingdom = emptyKingdomWithCastle();
    const lord = createLordBuilder()
      .withId("lord1-id")
      .withPlayerId("player1-id")
      .withHasPick(false)
      .build();
    const player = createPlayerBuilder()
      .withId("player1-id")
      .withName("Alice")
      .withKingdom(kingdom)
      .build();

    const actionPick: NextAction = {
      type: "action",
      nextLord: "lord1-id",
      nextAction: "pickDomino",
    };

    // Only 4 dominoes left in draw pile, turn 5 of 6
    const game = createGameBuilder()
      .withPlayers([player])
      .withLords([lord])
      .withCurrentDominoes(availableDominoes)
      .withDominoes([wheatDomino, crownedDomino, forestDomino, wheatDomino])
      .withNextAction(actionPick)
      .withTurn(5)
      .build();

    return { game, lordId: "lord1-id", availableDominoes };
  };

  describe("choosePlacement", () => {
    test("should return a valid placement", () => {
      const ctx = makePlaceContext(crownedDomino, validPlacementsNearCastle);
      // Override to near-end game
      const nearEndGame = createGameBuilder()
        .withPlayers(ctx.game.players)
        .withLords(ctx.game.lords)
        .withDominoes([wheatDomino])
        .withNextAction(ctx.game.nextAction)
        .withTurn(5)
        .build() as GameWithNextAction;

      const placement = expertStrategy.choosePlacement({
        ...ctx,
        game: nearEndGame,
      });

      expect(placement).not.toBeNull();
      expect(validPlacementsNearCastle).toContainEqual(placement);
    });

    test("should return null when no placements available", () => {
      const ctx = makePlaceContext(wheatDomino, []);
      expect(expertStrategy.choosePlacement(ctx)).toBeNull();
    });
  });

  describe("chooseDomino", () => {
    test("should return a valid domino number", () => {
      const available = [
        makeRevealsDomino(wheatDomino, 1),
        makeRevealsDomino(crownedDomino, 2),
      ];
      const ctx = makeExpertPickContext(available);
      const pick = expertStrategy.chooseDomino(ctx);

      const validNumbers = available.map((d) => d.domino.number);
      expect(validNumbers).toContain(pick);
    });
  });
});

// ─── playBotTurn ─────────────────────────────────────────────────────

describe("playBotTurn", () => {
  test("should call engine.chooseDomino for pickDomino action", () => {
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    const expectedState = { id: "new-state" } as any;
    const engine = {
      chooseDomino: vi.fn().mockReturnValue(expectedState),
      // biome-ignore lint/suspicious/noExplicitAny: test mock
    } as any;

    const available = [makeRevealsDomino(wheatDomino, 1)];
    const actionPick: NextAction = {
      type: "action",
      nextLord: "lord1-id",
      nextAction: "pickDomino",
    };

    const game = createGameBuilder()
      .withAllDefaults()
      .withCurrentDominoes(available)
      .withNextAction(actionPick)
      .build() as GameWithNextAction;

    const result = playBotTurn(engine, game, randomStrategy);

    expect(engine.chooseDomino).toHaveBeenCalledOnce();
    expect(result).toBe(expectedState);
  });

  test("should call engine.placeDomino for placeDomino action with valid placement", () => {
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    const expectedState = { id: "placed" } as any;
    const kingdom = emptyKingdomWithCastle();

    const lord = createLordBuilder()
      .withId("lord1-id")
      .withPlayerId("player1-id")
      .withDominoPicked(wheatDomino)
      .build();
    const player = createPlayerBuilder()
      .withId("player1-id")
      .withName("Alice")
      .withKingdom(kingdom)
      .build();

    const engine = {
      placeDomino: vi.fn().mockReturnValue(expectedState),
      discardDomino: vi.fn(),
      // biome-ignore lint/suspicious/noExplicitAny: test mock
    } as any;

    const actionPlace: NextAction = {
      type: "action",
      nextLord: "lord1-id",
      nextAction: "placeDomino",
    };

    const game = createGameBuilder()
      .withPlayers([player])
      .withLords([lord])
      .withNextAction(actionPlace)
      .withTurn(1)
      .build() as GameWithNextAction;

    // Use greedy to get a deterministic placement
    const result = playBotTurn(engine, game, greedyStrategy);

    expect(engine.placeDomino).toHaveBeenCalledOnce();
    expect(result).toBe(expectedState);
  });

  test("should call engine.discardDomino for pass action", () => {
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    const expectedState = { id: "discarded" } as any;
    const engine = {
      discardDomino: vi.fn().mockReturnValue(expectedState),
      // biome-ignore lint/suspicious/noExplicitAny: test mock
    } as any;

    const actionPass: NextAction = {
      type: "action",
      nextLord: "lord1-id",
      nextAction: "pass",
    };

    const game = createGameBuilder()
      .withAllDefaults()
      .withNextAction(actionPass)
      .build() as GameWithNextAction;

    const result = playBotTurn(engine, game, randomStrategy);

    expect(engine.discardDomino).toHaveBeenCalledOnce();
    expect(result).toBe(expectedState);
  });
});

// ─── isBotTurn / playBotTurns tests ──────────────────────────────────

describe("isBotTurn", () => {
  test("should return true when current lord belongs to a bot player", () => {
    const botPlayer = createPlayerBuilder()
      .withId("bot-player-id")
      .withName("Bot")
      .build();
    // Manually set bot field
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    (botPlayer as any).bot = { strategyName: "greedy" };

    const lord = createLordBuilder()
      .withId("lord-1")
      .withPlayerId("bot-player-id")
      .withHasPlace(true)
      .build();

    const game = createGameBuilder<NextAction>()
      .withPlayers([botPlayer])
      .withLords([lord])
      .withNextAction({
        type: "action",
        nextLord: "lord-1",
        nextAction: "pickDomino",
      })
      .build() as GameWithNextAction;

    expect(isBotTurn(game)).toBe(true);
  });

  test("should return false when current lord belongs to a human player", () => {
    const humanPlayer = createPlayerBuilder()
      .withId("human-player-id")
      .withName("Human")
      .build();

    const lord = createLordBuilder()
      .withId("lord-1")
      .withPlayerId("human-player-id")
      .withHasPlace(true)
      .build();

    const game = createGameBuilder<NextAction>()
      .withPlayers([humanPlayer])
      .withLords([lord])
      .withNextAction({
        type: "action",
        nextLord: "lord-1",
        nextAction: "pickDomino",
      })
      .build() as GameWithNextAction;

    expect(isBotTurn(game)).toBe(false);
  });
});
