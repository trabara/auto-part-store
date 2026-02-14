import { Heading, Hint, Label } from "@medusajs/ui"
import { Controller, useFormContext } from "react-hook-form"

import { useQuery } from '@tanstack/react-query'
import SelectOrCreateInput from "~/components/select-or-create-input"
import { sdk } from "~/lib/sdk"
import { Make } from "../../../../modules/fitment/schema"

type MakeListResponse = {
    makes: Make[]
    metadata: {
        count: number
    }
}

const MakeTab = () => {
    const form = useFormContext()

    const { data: makeListResponse } = useQuery({
        queryKey: ["makes"],
        queryFn: () => {
            return sdk.client.fetch<MakeListResponse>('/admin/makes', {
                query: {
                    fields: "id,name"
                }
            })
        },
    })

    const makeOptions = makeListResponse?.makes.map(make => ({ label: make.name, value: make.name })) || []



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
                            <SelectOrCreateInput
                                className="w-full"
                                placeholder="Enter make name"
                                options={makeOptions}
                                error={fieldState.error?.message}
                                {...field} />
                        </div>
                    )} />
            </div>
        </div>
    )
}

export default MakeTab