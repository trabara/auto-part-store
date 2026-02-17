import { Fitment, Model } from "~/modules/fitment/schema";

export type ModelWithFitments = Model & {
  fitments: Fitment[];
};

export type ModelsResponse = {
  models: ModelWithFitments[];
  metadata: {
    count: number;
    offset: number;
    limit: number;
  };
};