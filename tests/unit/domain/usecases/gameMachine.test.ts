import { createActor } from "xstate";
import { machine } from "../../../../state/gameMachine";

describe("gameMachine", () => {
  it('should be in the "menu" state initially', () => {
    const actor = createActor(machine);
    actor.subscribe((state) => console.log(state.value, state.context));
    actor.start();
    actor.send({
      type: "ADD_PLAYERS",
      players: ["Player 1", "Player 2"],
    });
  });
});
