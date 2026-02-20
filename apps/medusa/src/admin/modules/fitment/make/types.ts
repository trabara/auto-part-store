import { Make, Model } from "~/modules/fitment/schema";

export type MakeWithModels = Make & { models: Model[] };

export type MakeListResponse<T extends Make = Make> = {
  makes: T[];
  metadata: {
    count: number;
    offset: number;
    limit: number;
  };
};