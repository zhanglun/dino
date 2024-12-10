import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 10000,
    env: loadEnv("test", process.cwd(), ""),
    globals: true,
    environment: "node",
    // setupFiles: "./tests/setup.ts", // 如果你有额外的设置文件
  },
});
