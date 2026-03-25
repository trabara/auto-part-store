import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { BaseController } from "@repo/common";
import { FITMENT_MODULE } from "../../modules/fitment";
import { CreateFitmentInput, UpdateFitmentInput } from "../../modules/fitment/schema";
import { deleteFitmentWorkflow } from "../../workflows";
import { STORE_DETAILS_MODULE } from "../../modules/store";
import { UpdateStoreDetailsInput } from "../../modules/store/schema";

/**
 * Store Controller
 *
 * Handles all store-related HTTP requests.
 * Following SRP: Single responsibility is handling store HTTP requests.
 * Following DIP: Depends on abstraction (BaseController) not implementation.
 */
export class StoreController extends BaseController {
    constructor(req, res) {
        super(req, res);
    }

    public async getOne(): Promise<void> {
        await this.execute(async () => {
            const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);

            this.logger.info("Fetching store info");


            const { data } = await query.graph({
                entity: "store",
                fields: ["id", "name", "store_details.*"],
            });

            const store = data[0];
            if (!store) {
                this.logger.warn("Store not found");
                return this.notFound("Store not found");
            }

            this.logger.info("Store info retrieved successfully");


            this.success({ store });
        }, "Store info retrieved successfully");
    }


    public async update(): Promise<void> {
        await this.execute(async () => {
            const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);
            const link = this.req.scope.resolve(ContainerRegistrationKeys.LINK);
            const storeDetailsService = this.req.scope.resolve<any>(STORE_DETAILS_MODULE);

            try {
                const { data } = await query.graph({
                    entity: "store",
                    fields: ["id", "store_details.*"],
                });

                const store = data[0];

                if (!store) {
                    throw new Error("Store not found");
                }

                const details = (store as any).store_details;
                const body = this.req.validatedBody as UpdateStoreDetailsInput;

                if (details) {
                    const [updated] = await storeDetailsService.updateStoreDetails([{ id: details.id, ...body }]);

                    return this.success({ store_details: updated });
                }

                const [created] = await storeDetailsService.createStoreDetails([body]);

                await link.create({
                    [Modules.STORE]: {
                        store_id: store.id
                    },
                    [STORE_DETAILS_MODULE]: {
                        store_details_id: created.id
                    },
                });

                return this.success({ store_details: created });
            } catch (error) {
                this.handleError(error as Error);
            }

        }, "Store info updated successfully");
    }

}
