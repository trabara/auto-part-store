import type { ModuleDef } from "@repo/framework/core";
import { createContext, useContext, useRef } from "react";

export type ModuleContextValue<S = {}> = {
  module: ModuleDef;
  state: S;
  setState: (next: S) => void;
};

export const ModuleContext = createContext<ModuleContextValue<any> | null>(null);

export const useModule = <S = {}>(initialState?: S): ModuleContextValue<S> => {
  const context = useContext(ModuleContext) as ModuleContextValue<S> | null;
  if (!context) {
    throw new Error("useModule must be used within a <Module> provider");
  }

  // Seed state once per hook instance so re-renders with a new
  // initialState reference don't re-trigger setState (infinite loop).
  const seededRef = useRef(false);
  if (initialState && !seededRef.current) {
    seededRef.current = true;
    context.setState(initialState);
  }

  return context;
};
