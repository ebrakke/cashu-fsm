import { resolve } from "path";
import { defineConfig } from "vitest/config";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "cashu-fsm",
      fileName: "cashu-fsm",
      formats: ["es", "umd"],
    },
    sourcemap: "inline",
  },
  test: {},
  plugins: [dts()],
});
