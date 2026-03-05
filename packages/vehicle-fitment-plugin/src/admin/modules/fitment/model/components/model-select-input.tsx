import { useQuery } from '@tanstack/react-query';
import OptionSelect from '../../../../components/option-select';
import { SelectOrCreateInputProps } from '../../../../components/select-or-create-input';
import { listModels } from '../data';


type ModelSelectInputProps = Omit<SelectOrCreateInputProps, 'options'>;

export function ModelSelectInput(props: ModelSelectInputProps) {

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