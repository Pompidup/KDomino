import { test } from "@japa/runner";
import inMemoryDominoes from "../../../infrastructure/repositories/inMemoryDominoes.js";
import inMemoryGamesRepository from "../../../infrastructure/repositories/inMemoryGames.js";
import { draw } from "./draw.js";
import type { GameDependencies } from "./game.js";
import type { Game } from "../../entities/game.js";

test.group("Game Draw", (group) => {
  let gamesRepository: ReturnType<typeof inMemoryGamesRepository>;
  let dependencies: GameDependencies;
  let state: Game;

  group.setup(async () => {
    gamesRepository = inMemoryGamesRepository();
    dependencies = {
      dominoesRepository: inMemoryDominoes(),
      gamesRepository,
      uuidMethod: () => "uuid-test",
      randomMethod: (array) => array,
    };

    const dominoes = await inMemoryDominoes().getAll();
    const currentDominoes = dominoes.splice(0, 4);

    state = {
      id: "uuid-test",
      dominoes,
      currentDominoes: currentDominoes.map((domino, index) => {
        return {
          domino,
          picked: false,
          kingId: null,
          position: index + 1,
        };
      }),
      players: [],
      kings: [],
      turn: 1,
      maxTurns: 12,
      maxDominoes: 48,
      dominoesPerTurn: 4,
      order: {},
    };
  });

  test("should draw dominoes", async ({ expect }) => {
    // Arrange
    await gamesRepository.setup(state);

    const useCase = draw(dependencies);

    const payload = {
      state,
    };

    // Act
    const newState = await useCase(payload);

    // Assert
    expect(newState.dominoes.length).toEqual(40);
    expect(newState.currentDominoes.length).toEqual(4);
  });
});
