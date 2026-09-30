/// <reference types="vite/client" />

import type { ComponentType } from "react";
import "@medusajs/admin-sdk";

declare module "@medusajs/admin-sdk" {
  interface RouteConfig {
    /** Expands a dynamic route ([param]) into one sidebar item per entry. */
    items?: Array<{
      param: string;
      label: string;
      icon?: ComponentType;
      rank?: number;
      translationNs?: string;
    }>;
  }
  function defineRouteConfig(config: RouteConfig | (() => RouteConfig));
}
