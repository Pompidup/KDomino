import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "build.js"],
    coverage: {
      exclude: ["build.js", "src/utils/testHelpers.ts"],
    },
  },
});
