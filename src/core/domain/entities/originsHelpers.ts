import type { OriginsSubMode } from "@core/domain/types/origins.js";

const ORIGINS_MODE_PREFIX = "KingdominoOrigins-";

/**
 * Checks whether the given mode name is an Origins mode.
 */
export const isOriginsMode = (modeName: string): boolean =>
  modeName.startsWith(ORIGINS_MODE_PREFIX);

/**
 * Extracts the sub-mode from an Origins mode name.
 * Returns undefined if not an Origins mode.
 */
export const getOriginsSubMode = (
  modeName: string,
): OriginsSubMode | undefined => {
  if (!isOriginsMode(modeName)) return undefined;
  return modeName.slice(ORIGINS_MODE_PREFIX.length) as OriginsSubMode;
};

/**
 * Checks whether the mode is a Totem or Tribe mode (modes that use resources).
 */
export const isResourceMode = (modeName: string): boolean => {
  const sub = getOriginsSubMode(modeName);
  return sub === "Totem" || sub === "Tribe";
};

/**
 * Checks whether the mode is the Tribe mode (has cave board + cavemen).
 */
export const isTribeMode = (modeName: string): boolean => {
  return getOriginsSubMode(modeName) === "Tribe";
};

/**
 * Checks whether the mode is the Totem mode (has totem majority tiles).
 */
export const isTotemMode = (modeName: string): boolean => {
  return getOriginsSubMode(modeName) === "Totem";
};
