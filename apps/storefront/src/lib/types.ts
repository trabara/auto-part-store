export const SORT_OPTIONS = [
    "created_at",
    "name_asc",
    "name_desc",
    "price_asc",
    "price_desc",
] as const

export type SortOptions = (typeof SORT_OPTIONS)[number]

export type Engine = {
    id: string,
    fuel: string,
    size: string,
    type: string,
    tech: string | null,
}

export type Fitment = {
    id: string,
    year_start: number,
    year_end: number,
    engine: Engine
    model: Model
}

export type Model = {
    id: string,
    name: string,
    make: Make,
    fitments: Fitment[]
}

export type Make = {
    id: string,
    name: string,
    models: Array<Model>
}

export type FitmentListResponse = {
    makes: Array<Make>,
    metadata: {
        total: number,
        page: number,
        per_page: number,
    }
}
