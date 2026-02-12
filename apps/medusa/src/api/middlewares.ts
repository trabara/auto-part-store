import { defineMiddlewares, validateAndTransformBody, validateAndTransformQuery, } from "@medusajs/framework"
import { CreateFitmentSchema } from "../modules/fitment/schema";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";

const findParams = createFindParams()

export default defineMiddlewares({
    routes: [
        {
            matcher: "/admin/fitments",
            methods: ["POST"],
            middlewares: [
                validateAndTransformBody(CreateFitmentSchema)
            ],
        },
        {
            matcher: "/admin/makes",
            methods: ["GET"],
            middlewares: [
                validateAndTransformQuery(findParams, {
                    defaults: [
                        "id",
                        "name",
                    ],
                    isList: true
                })
            ]
        },
         {
            matcher: "/admin/models",
            methods: ["GET"],
            middlewares: [
                validateAndTransformQuery(findParams, {
                    defaults: [
                        "id",
                        "name",
                    ],
                    isList: true
                })
            ]
        }
    ],
})
