import { createContext, useContext } from "react";
import { CrudConfig } from "../lib/types";

type MedusaCrudContext<TData = unknown> = {
  config: CrudConfig<any, any, any>;
  data: TData;
  setData: (data: Partial<TData>) => void;
};

export const MedusaCrudContext = createContext<MedusaCrudContext | null>(null);

export const useMedusaCrud = <TData>() => {
  const context = useContext(MedusaCrudContext);
  if (!context) {
    throw new Error("useMedusaCrud must be used within a MedusaCrudProvider");
  }
  return context as MedusaCrudContext<TData>;
};
