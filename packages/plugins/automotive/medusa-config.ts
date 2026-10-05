// Used only by the plugin's integration tests (`medusaIntegrationTestRunner`
// boots the plugin's own `src` as a Medusa project). Apps register the plugin
// through their own medusa-config.
import { defineConfig, loadEnv } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "test", process.cwd());

export default defineConfig({
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
  modules: [{ resolve: "./src/modules/automotive" }],
});
