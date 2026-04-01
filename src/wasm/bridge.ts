import { createGameEngine } from "../index.js";
import { dispatch } from "./dispatch.js";
import type { RpcRequest } from "./types.js";

// UUID fallback for environments without crypto.randomUUID (e.g. QuickJS)
const uuidFallback = (): string =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });

const uuidMethod =
  typeof globalThis.crypto?.randomUUID === "function"
    ? () => globalThis.crypto.randomUUID()
    : uuidFallback;

const engine = createGameEngine({ uuidMethod });

// Read all of stdin
const chunks: Uint8Array[] = [];
const buf = new Uint8Array(4096);
for (;;) {
  const bytesRead = Javy.IO.readSync(0, buf);
  if (bytesRead <= 0) break;
  chunks.push(buf.slice(0, bytesRead));
}

const decoder = new TextDecoder();
const input = chunks.map((c) => decoder.decode(c)).join("");
const request: RpcRequest = JSON.parse(input);

const response = dispatch(engine, request);

const encoder = new TextEncoder();
Javy.IO.writeSync(1, encoder.encode(JSON.stringify(response)));
