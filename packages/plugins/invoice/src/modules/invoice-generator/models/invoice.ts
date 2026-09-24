import { InferTypeOf } from "@medusajs/framework/types"
import { model } from "@medusajs/framework/utils"

export enum InvoiceStatus {
    LATEST = "latest",
    STALE = "stale",
}

export const Invoice = model.define("invoice", {
    id: model.id().primaryKey(),
    display_id: model.autoincrement(),
    order_id: model.text(),
    status: model.enum(InvoiceStatus).default(InvoiceStatus.LATEST),
    content: model.json(),
})

export type Invoice = InferTypeOf<typeof Invoice>