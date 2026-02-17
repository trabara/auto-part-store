import { useQuery } from '@tanstack/react-query';
import { sdk } from "~/admin/lib/sdk";
import { Model } from '~/modules/fitment/schema';
import SelectOrCreateInput, { SelectOrCreateInputProps } from './select-or-create-input';

type ModelListResponse = {
    models: Model[]
    metadata: {
        count: number
    }
}

type ModelsSelectInputProps = Omit<SelectOrCreateInputProps, 'options'> & {
    makeName: string
}

export function ModelsSelectInput({ value, makeName, ...props }: ModelsSelectInputProps) {

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
        <SelectOrCreateInput
            {...props}
            options={modelOptions}
        />
    );
}