import type { DomainException } from "@core/domain/errors/domainErrors.js";
import type { GameEngine } from "@core/portUserside/engine.js";
import type { RpcRequest, RpcResponse } from "./types.js";

const ENGINE_METHODS: ReadonlySet<string> = new Set<keyof GameEngine>([
  "getModes",
  "getExtraRules",
  "createGame",
  "addPlayers",
  "addExtraRules",
  "startGame",
  "chooseDomino",
  "placeDomino",
  "discardDomino",
  "getResults",
  "calculateScore",
  "getValidPlacements",
  "canPlaceDomino",
  "serialize",
  "deserialize",
  "getDynastyResults",
]);

export const dispatch = (
  engine: GameEngine,
  request: RpcRequest,
): RpcResponse => {
  const { method, params } = request;

  if (!ENGINE_METHODS.has(method)) {
    return {
      error: {
        code: "UNKNOWN_METHOD",
        message: `Unknown method: ${method}`,
      },
    };
  }

  try {
    const fn = engine[method as keyof GameEngine] as (
      params: unknown,
    ) => unknown;
    const result = fn(params);
    return { result };
  } catch (err: unknown) {
    const code = isDomainException(err) ? err.code : "INTERNAL_ERROR";
    const message = err instanceof Error ? err.message : String(err);
    return { error: { code, message } };
  }
};

const isDomainException = (err: unknown): err is DomainException => {
  return (
    err instanceof Error &&
    "code" in err &&
    typeof (err as DomainException).code === "string"
  );
};
