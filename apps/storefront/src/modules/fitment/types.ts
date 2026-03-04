import { z } from "zod";
import { FitmentFormSchema } from "./schema";

export type FitmentFormType = z.infer<typeof FitmentFormSchema>