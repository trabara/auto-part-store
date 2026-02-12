import { z } from "@medusajs/framework/zod"
import { EngineSchema, Fitment } from "../../../../modules/fitment/schema"

export const MAKE_OPTIONS = [
    {
        label: "Hyundai",
        value: "hyundai"
    },
    {
        label: "Kia",
        value: "kia"
    },
    {
        label: "Suzuki",
        value: "suzuki"
    }
]

export const MODEL_OPTIONS = [
    {
        label: "Accent",
        value: "accent"
    },
    {
        label: "Elantra",
        value: "elantra"
    },
    {
        label: "Santa Fe",
        value: "santa_fe"
    }
]

export const ENGINE_FUEL_OPTIONS = [
    {
        label: "Gasoline",
        value: "gasoline"
    },
    {
        label: "Diesel",
        value: "diesel"
    },
    {
        label: "Electric",
        value: "electric"
    },
    {
        label: "Hybrid",
        value: "hybrid"
    }
]

export const ENGINE_TYPE_OPTIONS = [
    {
        label: "I4",
        value: "I4"
    },
    {
        label: "V6",
        value: "V6"
    },
    {
        label: "V8",
        value: "V8"
    },
    {
        label: "Electric",
        value: "electric"
    }
]

export const ENGINE_SIZE_OPTIONS =
    [
        {
            label: "1.0",
            value: "1.0"
        },
        {
            label: "1.2",
            value: "1.2"
        },
        {
            label: "1.4",
            value: "1.4"
        },
        {
            label: "1.5",
            value: "1.5"
        },
        {
            label: "2.0",
            value: "2.0"
        },
        {
            label: "2.5",
            value: "2.5"
        },
        {
            label: "3.0",
            value: "3.0"
        },
        {
            label: "3.5",
            value: "3.5"
        },
        { label: "4.0", value: "4.0" },
        { label: "Electric", value: "electric" }
    ]

export const STEPS = {
    general: {
        label: "General",
        validate: (data: Fitment) => z.object({
            body_style: z.string(),
            drive: z.string(),
            transmission: z.string(),
            year_start: z.number().min(1886).max(new Date().getFullYear()),
            year_end: z.number().min(1886).max(new Date().getFullYear()),
        }).parse(data),
        accessor: undefined,
        error: "Please fill all the general details and ensure years are valid"
    },
    make: {
        label: "Make",
        validate: (data: Fitment) => z.object({ name: z.string() }).parse(data.model.make),
        accessor: "model.make.name",
        error: "Make name is required"
    },
    model: {
        label: "Model",
        validate: (data: Fitment) => z.object({ name: z.string() }).parse(data.model),
        accessor: "model.name",
        error: "Model name is required"
    },
    engine: {
        label: "Engine",
        validate: (data: Fitment) => EngineSchema.parse(data.engine),
        accessor: "engine",
        error: "Engine details are required and size must be a valid number"
    }
}

export type Steps = keyof typeof STEPS
