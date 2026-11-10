import {
  createEmptyKingdom,
  placeCastle,
} from "@core/domain/entities/kingdom.js";
import { ErrorCode } from "@core/domain/errors/domainErrors.js";
import type {
  GameWithNextAction,
  NextAction,
} from "@core/domain/types/game.js";
import type { Kingdom } from "@core/domain/types/kingdom.js";
import type { Player } from "@core/domain/types/player.js";
import { placeGiantUseCase } from "@core/useCases/placeGiant.js";
import { sendGiantUseCase } from "@core/useCases/sendGiant.js";
import { skipOptionalActionUseCase } from "@core/useCases/skipOptionalAction.js";
import { err, unwrap } from "@utils/result.js";
import { describe, expect, test } from "vitest";
import { createGameBuilder } from "../../builder/game.js";
import { createLordBuilder } from "../../builder/lord.js";

/** Kingdom with a crown on each of the given x positions of row 3. */
const kingdomWithCrowns = (xs: number[]): Kingdom => {
  const kingdom = placeCastle(createEmptyKingdom());
  for (const x of xs) {
    kingdom[3]![x] = { type: "forest", crowns: 1 };
  }
  return kingdom;
};

const buildGame = (options: {
  action: NextAction["nextAction"];
  targetCrowns: number[];
  mode?: string;
}): GameWithNextAction => {
  const sender: Player = {
    id: "p1",
    name: "Alice",
    kingdom: kingdomWithCrowns([3]),
    giants: [{ position: { x: 3, y: 3 } }],
  };
  const target: Player = {
    id: "p2",
    name: "Bob",
    kingdom: kingdomWithCrowns(options.targetCrowns),
    giants: [],
  };
  const lords = [
    createLordBuilder()
      .withId("l1")
      .withPlayerId("p1")
      .withHasPick(false)
      .withHasPlace(true)
      .withTurnEnded(false)
      .build(),
    createLordBuilder()
      .withId("l2")
      .withPlayerId("p2")
      .withHasPick(false)
      .withHasPlace(false)
      .withTurnEnded(false)
      .build(),
  ];

  return {
    ...createGameBuilder<NextAction>()
      .withMode({ name: options.mode ?? "AgeOfGiants", description: "" })
      .withPlayers([sender, target])
      .withLords(lords)
      .withTurn(3)
      .withNextAction<NextAction>({
        type: "action",
        nextLord: "l1",
        nextAction: options.action,
      })
      .build(),
    ageOfGiants: { giantPool: 4, questTiles: [] },
  } as GameWithNextAction;
};

describe("placeGiant is mandatory", () => {
  test("skipOptionalAction refuses to skip placeGiant", () => {
    const game = buildGame({ action: "placeGiant", targetCrowns: [] });
    expect(skipOptionalActionUseCase(game, "l1")).toEqual(
      err(ErrorCode.INVALID_OPTIONAL_ACTION),
    );
  });

  test("skipOptionalAction still allows skipping sendGiant", () => {
    const game = buildGame({ action: "sendGiant", targetCrowns: [5] });
    const result = unwrap(skipOptionalActionUseCase(game, "l1"));
    expect(result.nextAction).toEqual({
      type: "action",
      nextLord: "l1",
      nextAction: "pickDomino",
    });
  });
});

describe("sendGiant: the targeted opponent chooses the crown", () => {
  test("a single free crown is covered automatically", () => {
    const game = buildGame({ action: "sendGiant", targetCrowns: [5] });
    const result = unwrap(sendGiantUseCase(game, "l1", 0, "p2"));

    expect(result.players.find((p) => p.id === "p1")!.giants).toEqual([]);
    expect(result.players.find((p) => p.id === "p2")!.giants).toEqual([
      { position: { x: 5, y: 3 } },
    ]);
    expect(result.ageOfGiants?.pendingGiant).toBeUndefined();
    expect(result.nextAction).toEqual({
      type: "action",
      nextLord: "l1",
      nextAction: "pickDomino",
    });
  });

  test("with several free crowns the opponent is asked through placeGiant", () => {
    const game = buildGame({ action: "sendGiant", targetCrowns: [2, 5] });
    const sent = unwrap(sendGiantUseCase(game, "l1", 0, "p2"));

    expect(sent.players.find((p) => p.id === "p1")!.giants).toEqual([]);
    expect(sent.players.find((p) => p.id === "p2")!.giants).toEqual([]);
    expect(sent.ageOfGiants?.pendingGiant).toEqual({
      fromLordId: "l1",
      targetPlayerId: "p2",
    });
    expect(sent.nextAction).toEqual({
      type: "action",
      nextLord: "l2",
      nextAction: "placeGiant",
    });

    const pending = sent as GameWithNextAction;

    // Cannot be skipped, and only the targeted player may choose
    expect(skipOptionalActionUseCase(pending, "l2")).toEqual(
      err(ErrorCode.INVALID_OPTIONAL_ACTION),
    );
    expect(placeGiantUseCase(pending, "l1", { x: 2, y: 3 })).toEqual(
      err(ErrorCode.NOT_YOUR_TURN),
    );
    expect(placeGiantUseCase(pending, "l2", { x: 4, y: 4 })).toEqual(
      err(ErrorCode.INVALID_GIANT_PLACEMENT),
    );

    const placed = unwrap(placeGiantUseCase(pending, "l2", { x: 2, y: 3 }));
    expect(placed.players.find((p) => p.id === "p2")!.giants).toEqual([
      { position: { x: 2, y: 3 } },
    ]);
    // The sent giant does not come from the pool
    expect(placed.ageOfGiants?.giantPool).toBe(4);
    expect(placed.ageOfGiants?.pendingGiant).toBeUndefined();
    // The sender's turn resumes: they now pick their next domino
    expect(placed.nextAction).toEqual({
      type: "action",
      nextLord: "l1",
      nextAction: "pickDomino",
    });
  });

  test("AoG-QueenDomino: the sender continues with placeKnight after the opponent's choice", () => {
    const game = buildGame({
      action: "sendGiant",
      targetCrowns: [2, 5],
      mode: "AgeOfGiants-QueenDomino",
    });
    const sent = unwrap(sendGiantUseCase(game, "l1", 0, "p2"));
    const placed = unwrap(
      placeGiantUseCase(sent as GameWithNextAction, "l2", { x: 5, y: 3 }),
    );
    expect(placed.nextAction).toEqual({
      type: "action",
      nextLord: "l1",
      nextAction: "placeKnight",
    });
  });

  test("an explicit crown (chosen by the opponent) is still accepted", () => {
    const game = buildGame({ action: "sendGiant", targetCrowns: [2, 5] });
    const result = unwrap(
      sendGiantUseCase(game, "l1", 0, "p2", { x: 5, y: 3 }),
    );
    expect(result.players.find((p) => p.id === "p2")!.giants).toEqual([
      { position: { x: 5, y: 3 } },
    ]);
    expect(result.ageOfGiants?.pendingGiant).toBeUndefined();
  });

  test("an opponent without a free crown cannot receive a giant", () => {
    const game = buildGame({ action: "sendGiant", targetCrowns: [] });
    expect(sendGiantUseCase(game, "l1", 0, "p2")).toEqual(
      err(ErrorCode.INVALID_GIANT_PLACEMENT),
    );
  });

  test("an unknown giant index is rejected before asking the opponent", () => {
    const game = buildGame({ action: "sendGiant", targetCrowns: [2, 5] });
    expect(sendGiantUseCase(game, "l1", 3, "p2")).toEqual(
      err(ErrorCode.GIANT_NOT_FOUND),
    );
  });
});
