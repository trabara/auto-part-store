import { MiddlewareRoute, validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework";
import { z } from "@medusajs/framework/zod";
import { authenticate } from "@medusajs/framework";
import { createFindParams, createOperatorMap } from "@medusajs/medusa/api/utils/validators";
import { CreateFitmentSchema, UpdateFitmentSchema } from "@/modules/fitment/schema";


export const LinkFitmentsSchema = z.object({
  fitment_ids: z
    .array(z.string())
    .min(1, "At least one fitment ID is required"),
});

export type LinkFitmentsSchema = z.infer<typeof LinkFitmentsSchema>;

const findParams = createFindParams();

const fitmentFindParams = findParams.extend({
  filters: z
    .object({
      model: z
        .object({
          name: createOperatorMap(z.string()),
          make: z
            .object({
              name: createOperatorMap(z.string()),
            })
            .optional(),
        })
        .optional(),
      engine: z
        .object({
          size: createOperatorMap(z.string()),
          fuel: createOperatorMap(z.string()),
        })
        .optional(),
      body_style: createOperatorMap(z.string()).optional(),
      drive: createOperatorMap(z.string()).optional(),
      transmission: createOperatorMap(z.string()).optional(),
      year_start: createOperatorMap(z.number()).optional(),
      year_end: createOperatorMap(z.number()).optional(),
    })
    .optional(),
});


const authenticateMiddleware = authenticate(["*"], ["session"]);

export const productFitmentMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/fitments",
    methods: ["POST"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(CreateFitmentSchema),
    ],
  },
  {
    matcher: "/admin/fitments/:id",
    methods: ["GET"],
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/fitments/:id",
    methods: ["DELETE"],
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/fitments",
    methods: ["PATCH"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(UpdateFitmentSchema),
    ],
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
        isList: true,
      }),
    ],
  },
  {
    matcher: "/admin/products/:id/fitments",
    method: "GET",
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/products/:id/fitments",
    method: "POST",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(LinkFitmentsSchema),
    ],
  },
  {
    matcher: "/admin/products/:id/fitments/:fitmentId",
    method: "DELETE",
    middlewares: [authenticateMiddleware],
  },
];
