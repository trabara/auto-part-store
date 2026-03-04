import { listMakesAction } from "@/lib/data/makes"
import { Engine, Make, Model } from "@/lib/types"
import { useActionState, useEffect, useState, useTransition } from "react"
import { UseFormReturn } from "react-hook-form"
import { INTIAL_ACTION_STATE } from "../constant"
import { FitmentFormType } from "../types"

type Option = {
    value: string;
    label: string;
}

type CallbackState = string | undefined

type SubmitCallback = (formData: FitmentFormType, state: CallbackState) => void

type State = {
    makes: Option[],
    models: Option[],
    engines: Option[],
    isPending: boolean
}

export type UseFitmentReturn = {
    state: State,
    handleSubmit: (callback: SubmitCallback) => (e?: React.BaseSyntheticEvent) => void,
    handleYearChange: (value: string) => void,
    handleMakeChange: (value: string) => void,
    handleModelChange: (value: string) => void,
    handleEngineChange: (value: string) => void,
}

// Shared ref map so multiple hook instances using the same form share selected state
const sharedStateMap = new WeakMap<UseFormReturn<any>, { current: CallbackState }>()

function getSharedRef(form: UseFormReturn<any>): { current: CallbackState } {
    if (!sharedStateMap.has(form)) {
        sharedStateMap.set(form, { current: undefined })
    }
    return sharedStateMap.get(form)!
}

export function useFitment(form: UseFormReturn<FitmentFormType>): UseFitmentReturn {
    const sharedRef = getSharedRef(form)

    const [actionState, action] = useActionState(listMakesAction, INTIAL_ACTION_STATE)
    const [selectedState, setSelectedState] = useState<Partial<{ make: Make, model: Model, engine: Engine }>>({})
    const [isPending, startTransition] = useTransition();


    const handleYearChange = (value: string) => {
        const data = new FormData()
        data.set("year_start", value)
        startTransition(() => {
            action(data)
        })
    }

    const handleMakeChange = (value: string) => {
        const make = actionState.makes.find((make) => make.id === value)
        setSelectedState({ make })
    }

    const handleModelChange = (value: string) => {
        const model = selectedState.make?.models.find((model) => model.id === value)
        setSelectedState((prev) => ({ ...prev, model }))
    }

    const handleEngineChange = (value: string) => {
        const engine = selectedState.model?.fitments.find((fitment) => fitment.engine.id === value)?.engine
        setSelectedState((prev) => ({ ...prev, engine }))
    }

    const makes: Option[] = actionState.makes.map((make) => ({
        value: make.id,
        label: make.name,
    }))

    const models: Option[] = selectedState.make ? selectedState.make.models.map((model) => ({
        value: model.id,
        label: model.name,
    })) : []

    const engines: Option[] = selectedState.model ? selectedState.model.fitments.map((fitment) => ({
        value: fitment.engine.id,
        label: `${fitment.engine.fuel} ${fitment.engine.size} ${fitment.engine.type} ${fitment.engine.tech || ""}`,
    })) : []

    const fitment = selectedState.model?.fitments.find((f) => f.engine.id === selectedState.engine?.id)

    useEffect(() => {
        if (fitment) {
            sharedRef.current = fitment.id
        }
    }, [fitment, sharedRef])

    useEffect(() => {
        const year_start = form.getValues("year")
        if (year_start) {
            handleYearChange(year_start.toString())
        }
    }, [])

    const handleSubmit = (callback: SubmitCallback) => {
        return form.handleSubmit((data) => {
            callback(data, sharedRef.current)
        })
    }

    return {
        state: {
            makes,
            models,
            engines,
            isPending,
        },
        handleSubmit,
        handleYearChange,
        handleMakeChange,
        handleModelChange,
        handleEngineChange
    }
}
