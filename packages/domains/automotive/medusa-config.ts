// Used only by the plugin's integration tests (`medusaIntegrationTestRunner`
// boots the plugin's own `src` as a Medusa project). Apps register the plugin
// through their own medusa-config.
import path from "path";
import { defineConfig, loadEnv } from "@medusajs/framework/utils";
import { automotiveDomain } from "./src/contract";

loadEnv(process.env.NODE_ENV || "test", process.cwd());

export default defineConfig({
  // As in the app: translatable fields are translated in store responses.
  featureFlags: { translation: true },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      jwtSecret: process.env.JWT_SECRET || "test-jwt-secret",
      cookieSecret: process.env.COOKIE_SECRET || "test-cookie-secret",
      storeCors: "",
      adminCors: "",
      authCors: "",
    },
  },
  // The domain's modules, loaded from source (Jest maps @repo/module-* imports
  // to the same files, so the server and the tests share one instance).
  modules: [
    ...automotiveDomain.modules.map((m) => ({
      resolve: path.join(__dirname, "../../modules", m.resolve!.replace("@repo/module-", ""), "src", "server"),
    })),
    // Entity translations, as in the app.
    { resolve: "@medusajs/medusa/translation" },
  ],
});
