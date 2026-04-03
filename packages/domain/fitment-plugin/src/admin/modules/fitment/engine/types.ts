import { Engine } from "@trabara/core/dtos";

export type AdminEngineListResponse = {
  engines: Engine[];
  metadata: {
    count: number;
    offset: number;
    limit: number;
  };
};
