import { defineConfig } from "tsup";

export default defineConfig([
  // Node.js bundle (published to npm)
  {
    entry: ["src/index.ts"],
    sourcemap: true,
    clean: true,
    dts: true,
    format: ["esm"],
    platform: "node",
  },
  // Universal bundle for WASM / non-Node environments
  {
    entry: { "index.universal": "src/index.ts" },
    outDir: "dist",
    sourcemap: false,
    clean: false,
    dts: false,
    format: ["esm"],
    platform: "neutral",
    noExternal: [/.*/],
  },
  // WASM bridge bundle (input for javy)
  {
    entry: { "wasm-bridge": "src/wasm/bridge.ts" },
    outDir: "dist",
    sourcemap: false,
    clean: false,
    dts: false,
    format: ["esm"],
    platform: "neutral",
    noExternal: [/.*/],
  },
]);
