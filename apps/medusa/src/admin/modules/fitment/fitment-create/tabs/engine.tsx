import { Heading, Hint, Input, Label } from "@medusajs/ui"
import { Controller, useFormContext } from "react-hook-form"
import OptionSelect from "~/admin/components/select"
import { ENGINE_FUEL_OPTIONS, ENGINE_SIZE_OPTIONS, ENGINE_TYPE_OPTIONS } from "~/modules/fitment/constant"


const EngineTab = () => {
    const form = useFormContext()
    return (
        <div>
            <Heading>Engine</Heading>
            <Hint>Enter the engine details of the vehicle.</Hint>
            <div className="mt-4 flex flex-col gap-y-6">
                <Controller
                    control={form.control}
                    name="engine.fuel"
                    render={({ field, fieldState }) => (
                        <div className="flex flex-col gap-y-2">
                            <Label htmlFor="engine-fuel">Fuel</Label>
                            <OptionSelect
                                className="w-full"
                                placeholder="Enter engine fuel"
                                options={ENGINE_FUEL_OPTIONS}
                                aria-invalid={!!fieldState.error}
                                {...field} />
                            {fieldState.error && <Hint variant="error">{fieldState.error.message}</Hint>}
                        </div>
                    )} />
                <Controller
                    control={form.control}
                    name="engine.type"
                    render={({ field, fieldState }) => (
                        <div className="flex flex-col gap-y-2">
                            <Label htmlFor="engine-type">Type</Label>
                            <OptionSelect
                                className="w-full"
                                placeholder="Enter engine type"
                                options={ENGINE_TYPE_OPTIONS}
                                aria-invalid={!!fieldState.error}
                                {...field} />
                            {fieldState.error && <Hint variant="error">{fieldState.error.message}</Hint>}
                        </div>
                    )} />
                <Controller
                    control={form.control}
                    name="engine.size"
                    render={({ field, fieldState }) => (
                        <div className="flex flex-col gap-y-2">
                            <Label htmlFor="engine-size">Size (L)</Label>
                            <OptionSelect
                                className="w-full"
                                placeholder="Enter engine size"
                                options={ENGINE_SIZE_OPTIONS}
                                aria-invalid={!!fieldState.error}
                                {...field} />
                            {fieldState.error && <Hint variant="error">{fieldState.error.message}</Hint>}
                        </div>
                    )} />
                <Controller
                    control={form.control}
                    name="engine.tech"
                    render={({ field, fieldState }) => (
                        <div className="flex flex-col gap-y-2">
                            <Label htmlFor="engine-tech">Tech</Label>
                            <Input aria-invalid={!!fieldState.error} placeholder="Enter engine tech (e.g. VVT, Turbo, etc.)" {...field} />
                            {fieldState.error && <Hint variant="error">{fieldState.error.message}</Hint>}
                        </div>
                    )} />
            </div>
        </div>
    )
}

export default EngineTab