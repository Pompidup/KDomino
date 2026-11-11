/**
 * `getMaxKnights` (GitHub #30): the knight limit of a player is exported, so
 * a client no longer copies the starting knight count of the rulebook.
 */
import { ErrorCode, NotFoundError } from "@core/domain/errors/domainErrors.js";
import {
  type GameState,
  type GameWithNextAction,
  isGameWithNextAction,
} from "@core/domain/types/game.js";
import { type Player, playerActions } from "@core/domain/types/player.js";
import { wrapWithActionLog } from "@core/useCases/gameActionLog.js";
import { wrapWithDebug } from "@core/useCases/gameDebug.js";
import { wrapWithEvents } from "@core/useCases/gameEvents.js";
import { describe, expect, test } from "vitest";
import { createGameEngine } from "../../index.js";

const engine = createGameEngine({});

const start = (mode: string, seed: string): GameState => {
  let game: GameState = engine.createGame({ mode, seed });
  game = engine.addPlayers({ game, players: ["Alice", "Bobby"] });
  return engine.startGame({ game });
};

const currentPlayer = (game: GameWithNextAction): Player => {
  const lord = game.lords.find((l) => l.id === game.nextAction.nextLord)!;
  return game.players.find((p) => p.id === lord.playerId)!;
};

/** Plays first domino / first placement / skip until `target` is reached. */
const advanceTo = (game: GameState, target: string): GameWithNextAction => {
  let current = game;
  for (let i = 0; i < 1000 && isGameWithNextAction(current); i++) {
    const g: GameWithNextAction = current;
    const lordId = g.nextAction.nextLord;
    if (g.nextAction.nextAction === target) return g;
    switch (g.nextAction.nextAction) {
      case playerActions.pickDomino:
        current = engine.chooseDomino({
          game: g,
          lordId,
          dominoPick: g.currentDominoes.find((d) => !d.picked)!.domino.number,
        });
        break;
      case playerActions.placeDomino:
      case playerActions.pass: {
        const lord = g.lords.find((l) => l.id === lordId)!;
        const [placement] = lord.dominoPicked
          ? engine.getValidPlacements({
              kingdom: currentPlayer(g).kingdom,
              domino: lord.dominoPicked,
              maxKingdomSize: g.rules.basic.maxKingdomSize,
            })
          : [];
        current =
          g.nextAction.nextAction === playerActions.placeDomino && placement
            ? engine.placeDomino({ game: g, lordId, ...placement })
            : engine.discardDomino({ game: g, lordId });
        break;
      }
      case playerActions.placeGiant:
        current = engine.placeGiant({
          game: g,
          lordId,
          position: engine.getValidGiantPositions({ game: g })[0]!,
        });
        break;
      default:
        current = engine.skipOptionalAction({ game: g, lordId });
    }
  }
  throw new Error(`Action ${target} never reached`);
};

describe("getMaxKnights", () => {
  describe.each(["QueenDomino", "AgeOfGiants-QueenDomino"])("%s", (mode) => {
    test("every player starts with the single knight of the rulebook", () => {
      let game: GameState = engine.createGame({ mode, seed: "max-knights" });
      game = engine.addPlayers({ game, players: ["Alice", "Bobby", "Carol"] });
      for (const player of game.players) {
        expect(engine.getMaxKnights({ game, playerId: player.id })).toBe(1);
      }
    });

    test("building bonus knights raise the limit", () => {
      const game = start(mode, "max-knights-bonus");
      const [alice, bobby] = game.players;
      const boosted = {
        ...game,
        players: game.players.map((p) =>
          p.id === alice!.id ? { ...p, bonusKnights: 2 } : p,
        ),
      };
      expect(engine.getMaxKnights({ game: boosted, playerId: alice!.id })).toBe(
        3,
      );
      expect(engine.getMaxKnights({ game: boosted, playerId: bobby!.id })).toBe(
        1,
      );
    });

    test("placeKnight stops accepting knights once the limit is reached", () => {
      const g = advanceTo(start(mode, "max-knights-limit"), "placeKnight");
      const player = currentPlayer(g);
      const max = engine.getMaxKnights({ game: g, playerId: player.id });
      expect(max - (player.knights?.length ?? 0)).toBe(1);
      expect(engine.getValidKnightPositions({ game: g })).not.toEqual([]);

      const next = engine.placeKnight({
        game: g,
        lordId: g.nextAction.nextLord,
        position: engine.getValidKnightPositions({ game: g })[0]!,
      });
      const after = next.players.find((p) => p.id === player.id)!;
      expect(engine.getMaxKnights({ game: next, playerId: player.id })).toBe(
        max,
      );
      expect(after.knights).toHaveLength(max);
      // No knight left: the second square of the domino is refused
      expect(engine.getValidKnightPositions({ game: next })).toEqual([]);
    });
  });

  test.each([
    "Classic",
    "AgeOfGiants",
    "KingdominoOrigins-Discovery",
  ])("is 0 in %s (no knights)", (mode) => {
    const game = start(mode, "max-knights-none");
    for (const player of game.players) {
      expect(engine.getMaxKnights({ game, playerId: player.id })).toBe(0);
    }
  });

  test("an unknown player throws PLAYER_NOT_FOUND", () => {
    const game = start("QueenDomino", "max-knights-unknown");
    const act = () => engine.getMaxKnights({ game, playerId: "nobody" });
    expect(act).toThrowError(NotFoundError);
    try {
      act();
    } catch (error) {
      expect((error as NotFoundError).code).toBe(ErrorCode.PLAYER_NOT_FOUND);
    }
  });

  test("the events, action log and debug wrappers pass it through", () => {
    const game = start("QueenDomino", "max-knights-wrappers");
    const playerId = game.players[0]!.id;
    const { engine: logged } = wrapWithActionLog(engine);
    const wrapped = [
      wrapWithEvents(engine, {}),
      logged,
      wrapWithDebug(engine, { logger: { log: () => {} } }),
    ];
    for (const w of wrapped) {
      expect(w.getMaxKnights({ game, playerId })).toBe(1);
    }
  });
});
