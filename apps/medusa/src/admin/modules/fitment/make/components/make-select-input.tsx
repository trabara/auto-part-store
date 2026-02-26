import { useQuery } from '@tanstack/react-query';
import OptionSelect, { OptionSelectProps } from '~/admin/components/option-select';
import { listMakes } from '../data';

type MakeSelectInputProps = Omit<OptionSelectProps, "options">;
export function MakeSelectInput({ value, ...props }: MakeSelectInputProps) {

    const { data: options } = useQuery({
        queryKey: ["makes"],
        queryFn: ({ signal }) => listMakes(signal),
        select: ({ makes }) => makes?.map(make => ({ label: make.name, value: make.id })) || [],
    })

    return (
        <OptionSelect
            {...props}
            options={options}
        />
    );
}