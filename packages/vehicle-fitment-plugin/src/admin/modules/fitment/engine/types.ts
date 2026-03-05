import { Engine } from "../../../../modules/fitment/schema";


export type AdminEngineListResponse = {
    engines: Engine[];
    metadata: {
        count: number;
        offset: number;
        limit: number;
    };
};
