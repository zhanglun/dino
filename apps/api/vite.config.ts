import { defineConfig } from "vite";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // setupFiles: "./tests/setup.ts", // 如果你有额外的设置文件
  },
});
