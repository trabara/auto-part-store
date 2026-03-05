import z from "zod";

export function zodSchemaWithTranslations<T extends z.ZodTypeAny>(
  schema: T,
  translations: Record<string, string>,
) {
  if (!(schema instanceof z.ZodObject)) {
    throw new Error("Schema must be a ZodObject");
  }
  const shape = schema.shape;
  const translatedShape: Record<string, z.ZodTypeAny> = {};

  for (const key in shape) {
    if (shape.hasOwnProperty(key)) {
      const field = shape[key];
      if (field instanceof z.ZodString && translations[key]) {
        // Apply translation as a refinement or custom error message
        translatedShape[key] = field.refine((val) => val.length > 0, {
          message: translations[key],
        });
      } else {
        translatedShape[key] = field;
      }
    }
  }
  return z.object(translatedShape);
}
