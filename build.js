import { build } from "esbuild";
import { dtsPlugin } from "esbuild-plugin-d.ts";

const option = {
  bundle: true,
  color: true,
  logLevel: "info",
  sourcemap: true,
  platform: "node",
  entryPoints: ["./src/index.ts"],
  packages: "external",
  minify: true,
};

async function run() {
  await build({
    format: "esm",
    outdir: "./dist",
    splitting: true,
    plugins: [dtsPlugin()],
    ...option,
  }).catch((e) => {
    console.error(e);
    process.exit(1);
  });

  await build({
    format: "cjs",
    outfile: "./dist/index.cjs.js",
    ...option,
  }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

run();
