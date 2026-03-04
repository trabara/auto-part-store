import { z } from "zod"

export const FitmentFormSchema = z.object({
    year: z.number(),
    make: z.string(),
    model: z.string(),
    engine: z.string(),
})