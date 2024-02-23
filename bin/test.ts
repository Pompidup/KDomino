import { expect } from "@japa/expect";
import { expectTypeOf } from "@japa/expect-type";
import { configure, processCLIArgs, run } from "@japa/runner";

processCLIArgs(process.argv.splice(2));

configure({
  suites: [
    {
      name: "unit",
      files: "src/**/*.test.ts",
    },
    {
      name: "functional",
      files: "tests/functional/**/*.test.ts",
    },
  ],

  plugins: [expect(), expectTypeOf()],
});

run();
