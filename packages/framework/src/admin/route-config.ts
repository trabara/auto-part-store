import type { RouteConfig } from "@medusajs/admin-sdk";
import type { SidebarItem } from "../core";

declare module "@medusajs/admin-sdk" {
  interface RouteConfig {
    /**
     * Sidebar entries under this route (e.g. `sidebarItems(module)`), expanded
     * by `medusaRouterExt`. A splat route's own entry is replaced by them.
     */
    items?: SidebarItem[];
  }
}

export type { RouteConfig };
