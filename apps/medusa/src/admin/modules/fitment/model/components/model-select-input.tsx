import { useQuery } from '@tanstack/react-query';
import OptionSelect from '~/admin/components/option-select';
import { SelectOrCreateInputProps } from '~/admin/components/select-or-create-input';
import { listModels } from '../data';


type ModelSelectInputProps = Omit<SelectOrCreateInputProps, 'options'>;

export function ModelSelectInput({ value, ...props }: ModelSelectInputProps) {

    const { data: modelOptions } = useQuery({
        queryKey: ["models"],
        select: (data) => data.models.map(model => ({ label: model.name, value: model.id })) || [],
        queryFn: listModels
    })


    return (
        <OptionSelect
            {...props}
            options={modelOptions}
        />
    );
}