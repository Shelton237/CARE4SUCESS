import { defineConfig } from "vitest/config";

// Configuration DÉDIÉE aux tests d'intégration scenario-director.
// Standalone (n'importe pas vite.config.ts) : environnement node, backend
// Express réel + MySQL de test. Lancée via :
//   npx vitest run --config vitest.integration.config.ts
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["server/__tests__/integration/scenarios/**/*.test.js"],
    globalSetup: ["server/__tests__/integration/globalSetup.js"],
    hookTimeout: 40000,
    testTimeout: 30000,
    fileParallelism: false, // suites séquentielles : pas de pollution croisée
    pool: "forks",
    reporters: ["default"],
  },
});
