/**
 * SdkProvider + useSdk.
 *
 * Provides the SDK instance to the React tree via context.
 * All components that use useSdk() must be wrapped in SdkProvider.
 *
 * Usage:
 * ```tsx
 * <SdkProvider sdk={api}>
 *   <App />
 * </SdkProvider>
 * ```
 */

import type Medusa from "@medusajs/js-sdk";
import { createContext, useContext } from "react";

export const SdkContext = createContext<Medusa | null>(null);


/**
 * Access the SDK instance from SdkProvider context.
 * Must be called within a component wrapped in <SdkProvider>.
 */
export function useSdk<Sdk extends Medusa>(): Sdk {
  const ctx = useContext(SdkContext);
  if (!ctx) {
    throw new Error(
      "useSdk() requires an <SdkProvider> ancestor. " +
        "Wrap your component tree with <SdkProvider sdk={api}>.",
    );
  }
  return ctx as Sdk;
}
