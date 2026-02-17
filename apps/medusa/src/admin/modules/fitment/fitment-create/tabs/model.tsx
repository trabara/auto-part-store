import { Heading, Hint, Label } from "@medusajs/ui"
import { Controller, useFormContext } from "react-hook-form"
import { ModelsSelectInput } from "~/admin/components/models-select-input"


const ModelTab = () => {
    const form = useFormContext()

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
                            <ModelsSelectInput
                                makeName={form.watch("model.make.name")}
                                className="w-full"
                                placeholder="Enter model name"
                                error={fieldState.error?.message}
                                {...field} />
                        </div>
                    )} />
            </div>
        </div>
    )
}

export default ModelTab