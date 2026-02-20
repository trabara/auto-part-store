import { useQuery } from '@tanstack/react-query';
import SelectOrCreateInput, { SelectOrCreateInputProps } from '~/admin/components/select-or-create-input';
import { listMakes } from '../data';



type MakeSelectInputProps = Omit<SelectOrCreateInputProps, 'options'> & {
}

export function MakeSelectInput({ value, ...props }: MakeSelectInputProps) {

    const { data: options } = useQuery({
        queryKey: ["makes"],
        select: (res) => res.makes?.map(make => ({ label: make.name, value: make.id })) || [],
        queryFn: listMakes
    })

    return (
        <SelectOrCreateInput
            {...props}
            options={options}
        />
    );
}