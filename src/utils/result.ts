export type Result<T> = Ok<T> | Err;

export interface Ok<T> {
  readonly tag: "Ok";
  readonly value: T;
}

export interface Err {
  readonly tag: "Err";
  readonly error: string;
}

export const ok = <T>(value: T): Ok<T> => ({ tag: "Ok", value });
export const err = (error: string): Err => ({ tag: "Err", error });

export const isOk = <T>(result: Result<T>): result is Ok<T> =>
  result.tag === "Ok";
export const isErr = <T>(result: Result<T>): result is Err =>
  result.tag === "Err";
