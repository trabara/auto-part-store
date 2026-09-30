import { createContext, useContext } from "react";
import { MedusaModule } from "../types";

export const ModuleContext = createContext<MedusaModule | null>(null);

export const useModule = () => {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error("useModule must be used within a MedusaCrudProvider");
  }
  return context;
};
