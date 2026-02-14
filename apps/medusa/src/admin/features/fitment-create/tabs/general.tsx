import { Heading, Hint, Input, Label } from "@medusajs/ui"
import { Controller, useFormContext } from "react-hook-form"
import OptionSelect from "~/components/select"
import { BODY_STYLE_OPTIONS, DRIVE_OPTIONS, TRANSMISSION_OPTIONS } from "../../../../modules/fitment/constant"

const GeneralTab = () => {
    const form = useFormContext()
    return (
        <div>
            <Heading>General</Heading>
            <Hint>Enter the general details of the vehicle.</Hint>
            <div className="mt-4 flex flex-col gap-y-6">
                <div className="flex gap-x-4">
                    <Controller
                        control={form.control}
                        name="year_start"
                        render={({ field, fieldState }) => (
                            <div className="flex-1 flex flex-col gap-y-2">
                                <Label htmlFor="year-start">Year Start</Label>
                                <Input aria-invalid={!!fieldState.error} placeholder="Enter year start" type="number" {...field} />
                                {fieldState.error && <Hint variant="error">{fieldState.error.message}</Hint>}
                            </div>
                        )} />
                    <Controller
                        control={form.control}
                        name="year_end"
                        render={({ field, fieldState }) => (
                            <div className="flex-1 flex flex-col gap-y-2">
                                <Label htmlFor="year-end">Year End</Label>
                                <Input aria-invalid={!!fieldState.error} placeholder="Enter year end" type="number" {...field} />
                                {fieldState.error && <Hint variant="error">{fieldState.error.message}</Hint>}
                            </div>
                        )} />
                </div>

                <Controller
                    control={form.control}
                    name="body_style"
                    render={({ field, fieldState }) => (
                        <div className="flex flex-col gap-y-2">
                            <Label htmlFor="body-style">Body Style</Label>
                            <OptionSelect
                                className="w-full"
                                placeholder="Enter body style"
                                options={BODY_STYLE_OPTIONS}
                                {...field} />
                            {fieldState.error && <Hint variant="error">{fieldState.error.message}</Hint>}
                        </div>
                    )} />
                <Controller
                    control={form.control}
                    name="doors"
                    render={({ field, fieldState }) => (
                        <div className="flex flex-col gap-y-2">
                            <Label htmlFor="doors">Doors</Label>
                            <Input aria-invalid={!!fieldState.error} placeholder="Enter number of doors" type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            {fieldState.error && <Hint variant="error">{fieldState.error.message}</Hint>}
                        </div>
                    )} />
                <Controller
                    control={form.control}
                    name="drive"
                    render={({ field, fieldState }) => (
                        <div className="flex flex-col gap-y-2">
                            <Label htmlFor="drive">Drive</Label>
                            <OptionSelect
                                className="w-full"
                                placeholder="Enter drive type"
                                options={DRIVE_OPTIONS}
                                {...field} />
                            {fieldState.error && <Hint variant="error">{fieldState.error.message}</Hint>}
                        </div>
                    )} />
                <Controller
                    control={form.control}
                    name="transmission"
                    render={({ field, fieldState }) => (
                        <div className="flex flex-col gap-y-2">
                            <Label htmlFor="transmission">Transmission</Label>
                            <OptionSelect
                                className="w-full"
                                placeholder="Enter transmission type"
                                options={TRANSMISSION_OPTIONS}
                                {...field} />
                            {fieldState.error && <Hint variant="error">{fieldState.error.message}</Hint>}
                        </div>
                    )} />
            </div>
        </div>
    )
}

export default GeneralTab