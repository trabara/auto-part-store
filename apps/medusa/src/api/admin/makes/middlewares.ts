import { authenticate, MiddlewareRoute, validateAndTransformQuery } from "@medusajs/framework";
import { z } from "@medusajs/framework/zod";
import { createFindParams, createOperatorMap } from "@medusajs/medusa/api/utils/validators";

const findParams = createFindParams();
const modelFindParams = findParams.extend({
    filters: z.object({
        make: z
            .object({
                name: createOperatorMap(z.string()),
            })
            .optional(),
    }),
});

const authenticateMiddleware = authenticate(["*"], ["session"]);
export const makesMiddlewares: MiddlewareRoute[] = [
    {
        matcher: "/admin/models",
        methods: ["GET"],
        middlewares: [
            authenticateMiddleware,
            validateAndTransformQuery(modelFindParams, {
                defaults: ["id", "name"],
                isList: true,
            }),
        ],
    },
];