import type {
  GameState,
  Orientation,
  Position,
  Rotation,
} from "@core/domain/types/index.js";

export type PlaceDominoCommand = {
  game: GameState;
  lordId: string;
  position: Position;
  orientation: Orientation;
  rotation: Rotation;
};
