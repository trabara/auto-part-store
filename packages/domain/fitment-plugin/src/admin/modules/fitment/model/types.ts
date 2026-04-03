import { Fitment, Model } from "@trabara/core/dtos";

export type ModelWithFitments = Model & {
  fitments: Fitment[];
};

export type ModelsWithFitmentsResponse = {
  models: ModelWithFitments[];
  metadata: {
    count: number;
    offset: number;
    limit: number;
  };
};

export type ModelListResponse = {
  models: Model[];
  metadata: {
    count: number;
  };
};
