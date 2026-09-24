import { VehicleEngine } from "../../../../modules/fitment/schemas/engine";
import { Vehicle } from "../../../../modules/fitment/schemas/vehicle";

export type AdminFitmentWithProducts = Vehicle & {
  products: { id: string }[];
  model: { id: string; name: string; make: { id: string; name: string } };
  engine: VehicleEngine;
};

export type FitmentListResponse = {
  data: AdminFitmentWithProducts[];
  metadata: {
    count: number;
    offset: number;
    limit: number;
  };
};
