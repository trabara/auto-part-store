import { expandDynamicMenuItems } from "@repo/core/vite";

if (process.env.EXPAND_DEBUG) {
  console.log("[expand-dynamic-menu-items] vite.config.mjs loaded (cwd:", process.cwd() + ")")
}
 

export default { plugins: [expandDynamicMenuItems] };
