import { useQuery } from '@tanstack/react-query';
import { sdk } from "~/lib/sdk";
import { Make } from '~/modules/fitment/schema';
import SelectOrCreateInput, { SelectOrCreateInputProps } from './select-or-create-input';

type MakeListResponse = {
    makes: Make[]
    metadata: {
        count: number
    }
}

type MakesSelectInputProps = Omit<SelectOrCreateInputProps, 'options'> & {
}

export function MakesSelectInput({ value, ...props }: MakesSelectInputProps) {

    const { data: makeListResponse } = useQuery({
        queryKey: ["makes"],
        queryFn: () => sdk.client.fetch<MakeListResponse>('/admin/makes', {
            query: {
                fields: "id,name",
            }
        })
    })

    const makeOptions = makeListResponse?.makes.map(make => ({ label: make.name, value: make.name })) || []

    return (
        <SelectOrCreateInput
            {...props}
            options={makeOptions}
        />
    );
}