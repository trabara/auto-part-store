import { z } from "@medusajs/framework/zod";
import { getZodShape } from "@snowpact/react-rhf-zod-form";
import { getZodFieldInfo } from "@snowpact/react-rhf-zod-form/src/utils";

export function zodQueryResolve(schema: z.ZodTypeAny, query: string = ""): string {
    if (!(schema instanceof z.ZodObject)) {
        return query;
    }

    const shape = getZodShape(schema);

    return Object.keys(shape)
        .map((key) => {
            const field = shape[key]!;

            const info = getZodFieldInfo(field);
            if (info.baseType === 'object') {
                return zodQueryResolve(info.unwrapped, query ? `${query}.${key}` : '+' + key);
            } else if (info.baseType === 'array') {
                console.log('array field', key, info);
                return zodQueryResolve(info.unwrapped._def.type, query ? `${query}.${key}` : '+' + key);
            }
            return query ? `${query}.${key}` : key;
        })
        .join(",");
}