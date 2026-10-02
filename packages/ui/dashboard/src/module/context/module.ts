import { Context, createContext, useContext } from "react";
import { ModuleType } from "../types";

type ModuleContext<S = {}> = ModuleType & {
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

  if (initialState) {
    context.setState(initialState);
  }

  return context;
};
