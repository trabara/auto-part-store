/**
 * Shared test fixtures for ORM package tests.
 */

import { z } from "@medusajs/framework/zod"

export const SimpleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email().optional(),
})

export const StatusSchema = z.enum(["active", "inactive", "pending"])

export enum NativeStatus {
  Draft = "draft",
  Published = "published",
  Archived = "archived",
}

export const NativeStatusSchema = z.nativeEnum(NativeStatus)

export const FullSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: StatusSchema,
  count: z.number().int(),
  is_active: z.boolean().default(true),
  description: z.string().optional(),
  price: z.number().nullable(),
  metadata: z.object({ key: z.string() }).optional(),
  tags: z.array(z.string()),
})

export const CustomerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
})

export const OrderSchema = z.object({
  id: z.string().min(1),
  customer: CustomerSchema,
  items: z.array(z.object({ product_id: z.string(), quantity: z.number() })),
  created_at: z.date(),
})

export function getEntitySchema(entity: any): Record<string, any> {
  return entity.schema ?? {}
}
