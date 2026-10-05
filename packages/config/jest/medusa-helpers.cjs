/**
 * Helpers for Medusa integration tests (`medusaIntegrationTestRunner`).
 *
 *   const { adminHeaders } = require("@repo/config/jest/medusa-helpers.cjs")
 *   const headers = await adminHeaders(getContainer())
 *   await api.get("/admin/…", headers)
 */
const jwt = require("jsonwebtoken");

let counter = 0;

/** Creates an admin user and returns axios options with its bearer token. */
async function adminHeaders(container, email = `admin-${Date.now()}-${++counter}@test.local`) {
  const user = await container.resolve("user").createUsers({ email });
  const { projectConfig } = container.resolve("configModule");
  const token = jwt.sign(
    { actor_id: user.id, actor_type: "user", auth_identity_id: "test" },
    projectConfig.http.jwtSecret,
    { expiresIn: "1d" },
  );
  return { headers: { authorization: `Bearer ${token}` } };
}

module.exports = { adminHeaders };
