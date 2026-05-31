/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    // Mirror the tsconfig "@/*" -> "./*" path alias.
    alias: { "@": path.resolve(__dirname) },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
