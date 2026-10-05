import Medusa from "@medusajs/js-sdk";

let instance: Medusa | undefined;

/**
 * The admin's Medusa client (session auth against the same origin, or
 * VITE_BACKEND_URL). Created on first use so importing this module has no
 * side effects.
 */
export function adminSdk(): Medusa {
  instance ??= new Medusa({
    baseUrl: import.meta.env.VITE_BACKEND_URL || "/",
    debug: import.meta.env.DEV,
    auth: { type: "session" },
  });
  return instance;
}
