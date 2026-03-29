import { z } from "@medusajs/framework/zod";

export function zodQueryResolve(schema: z.AnyZodObject, query: string = ""): string {
    if (!(schema instanceof z.ZodObject)) {
        return query;
    }

    const shape = schema.shape;

    return Object.keys(shape)
        .map((key) => {
            const field = shape[key];

            if (field instanceof z.ZodObject) {
                return zodQueryResolve(field, query ? `${query}.${key}` : key);
            } else if (field instanceof z.ZodArray && field._def.type instanceof z.ZodObject) {
                return zodQueryResolve(field._def.type, query ? `${query}.${key}` : '*' + key);
            }
            return query ? `${query}.${key}` : key;
        })
        .join(",");
}