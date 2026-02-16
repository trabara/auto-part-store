import { authenticate, MiddlewareRoute, validateAndTransformQuery } from "@medusajs/framework";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";

const authenticateMiddleware = authenticate(["*"], ["session"]);
const findParams = createFindParams();

export const modelsMiddlewares: MiddlewareRoute[] = [
    {
        matcher: "/admin/makes",
        methods: ["GET"],
        middlewares: [
            authenticateMiddleware,
            validateAndTransformQuery(findParams, {
                defaults: ["id", "name"],
                isList: true,
            }),
        ],
    },
];