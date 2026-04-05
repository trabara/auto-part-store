import { authenticate, MiddlewareRoute } from "@medusajs/framework";

export const adminStatsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/rbac/v2/stats",
    methods: ["GET"],
    middlewares: [authenticate(["*"], ["session"])],
  },
];
