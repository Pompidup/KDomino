import type {
  CavemanTile,
  HunterGathererKind,
  HunterGathererTile,
  WarriorTile,
  WarriorType,
} from "@core/domain/types/origins.js";
import type { CavemenRepository } from "@core/portServerside/cavemenRepository.js";
import cavemenJson from "../datasources/cavemen.json" with { type: "json" };

const mapCaveman = (raw: {
  kind: string;
  id: number;
  hunterType?: string;
  pointsPerMatch?: number;
  warriorType?: string;
  power?: number;
}): CavemanTile => {
  if (raw.kind === "hunterGatherer") {
    return {
      kind: "hunterGatherer",
      id: raw.id,
      hunterType: raw.hunterType as HunterGathererKind,
      pointsPerMatch: raw.pointsPerMatch!,
    } satisfies HunterGathererTile;
  }
  return {
    kind: "warrior",
    id: raw.id,
    warriorType: raw.warriorType as WarriorType,
    power: raw.power!,
  } satisfies WarriorTile;
};

const jsonCavemen = (): CavemenRepository => {
  const cavemen: CavemanTile[] = cavemenJson.map(mapCaveman);

  return {
    getAll: () => [...cavemen],
  };
};

export default jsonCavemen;
