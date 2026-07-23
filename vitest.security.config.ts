import { defineConfig } from "vitest/config";

// Configuration DÉDIÉE aux tests de sécurité (security-boundary-tester).
// Standalone : environnement node, backend Express réel + MySQL de test.
// Réutilise le globalSetup et le harness des scénarios d'intégration
// (démarrage du serveur pointé sur .env.test, cf. scenario-director).
// Lancée via :
//   npx vitest run --config vitest.security.config.ts
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["server/__tests__/security/**/*.security.test.js"],
    globalSetup: ["server/__tests__/integration/globalSetup.js"],
    hookTimeout: 40000,
    testTimeout: 30000,
    fileParallelism: false, // suites séquentielles : pas de pollution croisée
    pool: "forks",
    reporters: ["default"],
  },
});
