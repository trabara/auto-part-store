import { AdminProduct } from "@medusajs/framework/types";
import { Engine, Fitment, Model } from "@trabara/core/dtos";

export type AdminFitmentWithProducts = Fitment & {
  engine: Engine;
  model: Model;
  products: AdminProduct[];
};

export type AdminFitmentResponse<T extends Fitment> = {
  fitments: T[];
  metadata: {
    count: number;
    offset: number;
    limit: number;
  };
};
