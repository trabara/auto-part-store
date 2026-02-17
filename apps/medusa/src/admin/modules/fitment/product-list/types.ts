import { AdminProduct } from "@medusajs/framework/types";
import { Fitment } from "~/modules/fitment/schema";

export type AdminProductWithFitments = AdminProduct & { isLinked: boolean; fitments: Fitment[] }

export type AdminProductListWithFitmentsResponse = {
  /**
   * The list of products with their fitments.
   */
  products: AdminProductWithFitments[];
  metadata: {
    count: number;
    offset: number;
    limit: number;
  };
};