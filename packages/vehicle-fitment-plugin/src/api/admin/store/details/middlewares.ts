import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody
} from "@medusajs/framework/http";
import { UpdateStoreDetailsSchema } from "../../../../modules/store/schema";

const authenticateMiddleware = authenticate(["*"], ["session"]);

export const adminStoreDetailsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/store/details",
    method: "GET",
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/store/details",
    method: "POST",
    middlewares: [authenticateMiddleware, validateAndTransformBody(UpdateStoreDetailsSchema)],
  },
];
