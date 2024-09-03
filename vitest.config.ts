import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["src/utils/testHelpers.ts", "node_modules/", "dist/"],
    },
  },
});
