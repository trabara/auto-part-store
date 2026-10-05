import { Context, createContext, useContext, useRef } from "react";
import { defineModule } from "@repo/framework/core";

type ModuleContext<S = {}> = typeof defineModule & {
  state: S;
  setState: (prev: S) => void;
};

export const ModuleContext = createContext<ModuleContext | null>(null);

export const useModule = <S>(initialState?: S) => {
  const context = useContext<ModuleContext<S>>(
    ModuleContext as unknown as Context<ModuleContext<S>>,
  );
  if (!context) {
    throw new Error("useModule must be used within a ModuleProvider");
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
