import { configDefaults, defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [tsconfigPaths()],
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
    alias: {
      "@core": path.resolve(__dirname, "./src/core"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@application": path.resolve(__dirname, "./src/application"),
      "@adapter": path.resolve(__dirname, "./src/adapterServerside"),
    },
  },
});
