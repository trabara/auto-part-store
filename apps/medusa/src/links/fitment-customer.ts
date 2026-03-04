import { defineLink } from "@medusajs/framework/utils";
import CustomerModule from "@medusajs/medusa/customer";
import FitmentModule from "../modules/fitment";

export default defineLink(
    {
        linkable: CustomerModule.linkable.customer,
        isList: true,
        deleteCascade: true,
    },
    {
        linkable: FitmentModule.linkable.fitment,
        isList: true,
        deleteCascade: true
    },
    {
        database: {
            extraColumns: {
                session_id: {
                    type: 'text',
                    nullable: true,
                }
            },
        },
    }
);
