import { useQuery } from '@tanstack/react-query';
import { sdk } from "~/admin/lib/sdk";
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

    const { data: options } = useQuery({
        queryKey: ["makes"],
        select: (res) => res.makes?.map(make => ({ label: make.name, value: make.id })) || [],
        queryFn: () => sdk.client.fetch<MakeListResponse>('/admin/makes', {
            query: {
                fields: "id,name",
            }
        })
    })

    return (
        <SelectOrCreateInput
            {...props}
            options={options}
        />
    );
}