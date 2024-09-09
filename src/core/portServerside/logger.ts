export type Logger = Readonly<{
  info: (message: string) => void;
  error: (message: string) => void;
}>;
