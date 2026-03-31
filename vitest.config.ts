import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    exclude: [...configDefaults.exclude],
    coverage: {
      provider: "v8",
      reporter: ["json-summary"],
      exclude: ["node_modules/", "dist/"],
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
});
