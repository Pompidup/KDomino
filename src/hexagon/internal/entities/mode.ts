export const availableMode = ["Classic"] as const;

export type AvailableMode = (typeof availableMode)[number];

export const isValidMode = (mode: string): mode is AvailableMode => {
  return availableMode.includes(mode as AvailableMode);
};
