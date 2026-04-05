import { Fitment } from "@trabara/core/dtos";

export type AdminFitmentWithProducts = Fitment & {
  products: { id: string }[];
  model: { id: string; name: string; make: { id: string; name: string } };
  engine: {
    id: string;
    fuel: string;
    type: string;
    size: string;
    tech?: string;
  };
};

export type FitmentListResponse = {
  data: AdminFitmentWithProducts[];
  metadata: {
    count: number;
    offset: number;
    limit: number;
  };
};
