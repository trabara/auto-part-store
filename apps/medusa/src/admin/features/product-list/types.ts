import { AdminProduct, PaginatedResponse } from "@medusajs/framework/types";
import { Fitment } from "~/modules/fitment/schema";

export type AdminProductWithFitments = AdminProduct & { isLinked: boolean; fitments: Fitment[] }

export type AdminProductListWithFitmentsResponse = PaginatedResponse<{
  /**
   * The list of products with their fitments.
   */
  products: AdminProductWithFitments[];
}>;