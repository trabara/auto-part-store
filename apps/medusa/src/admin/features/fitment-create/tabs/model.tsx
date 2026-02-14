import { Heading, Hint, Label } from "@medusajs/ui"
import { useQuery } from '@tanstack/react-query'
import { Controller, useFormContext } from "react-hook-form"
import SelectOrCreateInput from "~/components/select-or-create-input"
import { sdk } from "~/lib/sdk"
import { Model } from "../../../../modules/fitment/schema"

type ModelListResponse = {
    models: Model[]
    metadata: {
        count: number
    }
}
const ModelTab = () => {
    const form = useFormContext()
    
    const makeName = form.watch("model.make.name")
    const { data: modelListResponse } = useQuery({
        queryKey: ["models", makeName],
        queryFn: () => sdk.client.fetch<ModelListResponse>('/admin/models', {
            query: {
                fields: "id,name",
                filters: {
                    make: { name: makeName }
                }
            }
        })
    })

    const modelOptions = modelListResponse?.models.map(model => ({ label: model.name, value: model.name })) || []



    return (
        <div>
            <Heading>Model</Heading>
            <Hint>Enter the model of the vehicle.</Hint>
            <div className="mt-4">
                <Controller
                    control={form.control}
                    name="model.name"
                    render={({ field, fieldState }) => (
                        <div className="flex flex-col gap-y-2">
                            <Label htmlFor="model-name">Name</Label>
                            <SelectOrCreateInput
                                className="w-full"
                                placeholder="Enter model name"
                                options={modelOptions}
                                error={fieldState.error?.message}
                                {...field} />
                        </div>
                    )} />
            </div>
        </div>
    )
}

export default ModelTab