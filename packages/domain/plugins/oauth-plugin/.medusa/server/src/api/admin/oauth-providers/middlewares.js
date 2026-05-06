"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOAuthProvidersMiddlewares = exports.UpsertOAuthProviderSchema = void 0;
const framework_1 = require("@medusajs/framework");
const zod_1 = require("@medusajs/framework/zod");
exports.UpsertOAuthProviderSchema = zod_1.z.object({
    provider: zod_1.z.string(),
    client_id: zod_1.z.string(),
    client_secret: zod_1.z.string(),
    callback_url: zod_1.z.string().url(),
    success_redirect_url: zod_1.z.string().url(),
    enabled: zod_1.z.boolean().default(false),
});
const authenticateMiddleware = (0, framework_1.authenticate)(["admin"], ["bearer", "session"]);
exports.adminOAuthProvidersMiddlewares = [
    {
        matcher: "/admin/oauth-providers",
        methods: ["GET"],
        middlewares: [authenticateMiddleware],
    },
    {
        matcher: "/admin/oauth-providers",
        methods: ["POST"],
        middlewares: [
            authenticateMiddleware,
            (0, framework_1.validateAndTransformBody)(exports.UpsertOAuthProviderSchema),
        ],
    },
    {
        matcher: "/admin/oauth-providers/:id",
        methods: ["DELETE"],
        middlewares: [authenticateMiddleware],
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlkZGxld2FyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL29hdXRoLXByb3ZpZGVycy9taWRkbGV3YXJlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtREFJNkI7QUFDN0IsaURBQTRDO0FBRS9CLFFBQUEseUJBQXlCLEdBQUcsT0FBQyxDQUFDLE1BQU0sQ0FBQztJQUNoRCxRQUFRLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtJQUNwQixTQUFTLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtJQUNyQixhQUFhLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtJQUN6QixZQUFZLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsRUFBRTtJQUM5QixvQkFBb0IsRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxFQUFFO0lBQ3RDLE9BQU8sRUFBRSxPQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztDQUNwQyxDQUFDLENBQUM7QUFJSCxNQUFNLHNCQUFzQixHQUFHLElBQUEsd0JBQVksRUFBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFFakUsUUFBQSw4QkFBOEIsR0FBc0I7SUFDL0Q7UUFDRSxPQUFPLEVBQUUsd0JBQXdCO1FBQ2pDLE9BQU8sRUFBRSxDQUFDLEtBQUssQ0FBQztRQUNoQixXQUFXLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQztLQUN0QztJQUNEO1FBQ0UsT0FBTyxFQUFFLHdCQUF3QjtRQUNqQyxPQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUM7UUFDakIsV0FBVyxFQUFFO1lBQ1gsc0JBQXNCO1lBQ3RCLElBQUEsb0NBQXdCLEVBQUMsaUNBQXlCLENBQUM7U0FDcEQ7S0FDRjtJQUNEO1FBQ0UsT0FBTyxFQUFFLDRCQUE0QjtRQUNyQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLENBQUM7UUFDbkIsV0FBVyxFQUFFLENBQUMsc0JBQXNCLENBQUM7S0FDdEM7Q0FDRixDQUFDIn0=