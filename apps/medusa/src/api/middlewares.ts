import { authenticate, defineMiddlewares, validateAndTransformBody, validateAndTransformQuery, } from "@medusajs/framework";
import { z } from "@medusajs/framework/zod";
import { createFindParams, createOperatorMap } from "@medusajs/medusa/api/utils/validators";
import { CreateFitmentSchema, UpdateFitmentSchema } from "../modules/fitment/schema";

const findParams = createFindParams()

const modelFindParams = findParams.extend({
    filters: z.object({
        make: z.object({
            name: createOperatorMap(z.string())
        }).optional()
    })
})

const fitmentFindParams = findParams.extend({
    filters: z.object({
        model: z.object({
            name: createOperatorMap(z.string()),
            make: z.object({
                name: createOperatorMap(z.string())
            }).optional()
        }).optional(),
        engine: z.object({
            size: createOperatorMap(z.string()),
            fuel: createOperatorMap(z.string()),
        }).optional(),
        body_style: createOperatorMap(z.string()).optional(),
        drive: createOperatorMap(z.string()).optional(),
        transmission: createOperatorMap(z.string()).optional(),
        year_start: createOperatorMap(z.number()).optional(),
        year_end: createOperatorMap(z.number()).optional(),
    }).optional()
})

const authenticateMiddleware = authenticate(["*"], ['session'])
export default defineMiddlewares({
    routes: [
        {
            matcher: "/admin/fitments",
            methods: ["POST"],
            middlewares: [
                authenticateMiddleware,
                validateAndTransformBody(CreateFitmentSchema)
            ],
        },
        {
            matcher: "/admin/fitments/:id",
            methods: ["DELETE"],
            middlewares: [
                authenticateMiddleware,
            ]
        },
        {
            matcher: "/admin/fitments/:id/products",
            methods: ["GET"],
            middlewares: [
                authenticateMiddleware,
                validateAndTransformQuery(findParams, {
                    defaults: [
                        "id",
                        "title",
                        "handle",
                    ],
                    isList: true
                })
            ]
        },
        {
            matcher: "/admin/fitments",
            methods: ["PATCH"],
            middlewares: [
                authenticateMiddleware,
                validateAndTransformBody(UpdateFitmentSchema)
            ]
        },
        {
            matcher: "/admin/fitments",
            methods: ["GET"],
            middlewares: [
                authenticateMiddleware,
                validateAndTransformQuery(fitmentFindParams, {
                    defaults: [
                        "id",
                        "model",
                        "engine",
                        "body_style",
                        "doors",
                        "drive",
                        "transmission",
                        "year_start",
                        "year_end",
                    ],
                    isList: true
                })
            ]
        },
        {
            matcher: "/admin/makes",
            methods: ["GET"],
            middlewares: [
                authenticateMiddleware,
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
                authenticateMiddleware,
                validateAndTransformQuery(modelFindParams, {
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
