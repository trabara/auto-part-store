import { AdminProduct } from "@medusajs/framework/types";
import { Fitment } from "~/modules/fitment/schema";

export type AdminFitmentWithProducts = Fitment & {
  products: AdminProduct[];
};

export type AdminFitmentResponse = {
  fitments: AdminFitmentWithProducts[];
  metadata: {
    count: number;
    offset: number;
    limit: number;
  };
};