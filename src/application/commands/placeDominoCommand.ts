import type {
  GameState,
  Position,
  Rotation,
} from "@core/domain/types/index.js";

export type PlaceDominoCommand = {
  game: GameState;
  lordId: string;
  position: Position;
  rotation: Rotation;
};
