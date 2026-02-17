import { Heading, Hint, Label } from "@medusajs/ui"
import { Controller, useFormContext } from "react-hook-form"

import { MakesSelectInput } from "~/components/makes-select-input"
import { Make } from "../../../../../modules/fitment/schema"

const MakeTab = () => {
    const form = useFormContext()

    return (
        <div>
            <Heading>Make</Heading>
            <Hint>Enter the make of the vehicle.</Hint>
            <div className="mt-4">
                <Controller
                    control={form.control}
                    name="model.make.name"
                    render={({ field, fieldState }) => (
                        <div className="flex flex-col gap-y-2">
                            <Label htmlFor="make-name">Name</Label>
                            <MakesSelectInput
                                className="w-full"
                                placeholder="Enter make name"
                                error={fieldState.error?.message}
                                {...field} />
                        </div>
                    )} />
            </div>
        </div>
    )
}

export default MakeTab