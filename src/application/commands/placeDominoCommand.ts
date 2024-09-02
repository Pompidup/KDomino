import type {
  GameWithNextAction,
  Orientation,
  Position,
  Rotation,
} from "../../core/domain/types/index.js";

export type PlaceDominoCommand = {
  game: GameWithNextAction;
  lordId: string;
  position: Position;
  orientation: Orientation;
  rotation: Rotation;
};
