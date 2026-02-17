import { Make, Model } from "~/modules/fitment/schema";

export type MakeWithModels = Make & { models: Model[] };

export type MakesResponse = {
  makes: MakeWithModels[];
  metadata: {
    count: number;
    offset: number;
    limit: number;
  };
};