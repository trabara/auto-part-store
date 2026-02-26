import { useQuery } from '@tanstack/react-query';
import OptionSelect from '~/admin/components/option-select';
import { SelectOrCreateInputProps } from '~/admin/components/select-or-create-input';
import { listModels } from '../data';


type ModelSelectInputProps = Omit<SelectOrCreateInputProps, 'options'>;

export function ModelSelectInput({ value, ...props }: ModelSelectInputProps) {

    const { data: modelOptions } = useQuery({
        queryKey: ["models"],
        queryFn: ({ signal }) => listModels(signal),
        select: ({ models }) => models?.map(model => ({ label: model.name, value: model.id })) || [],
    })


    return (
        <OptionSelect
            {...props}
            options={modelOptions}
        />
    );
}