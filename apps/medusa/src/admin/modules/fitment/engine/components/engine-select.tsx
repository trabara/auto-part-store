import { useQuery } from '@tanstack/react-query';
import OptionSelect from '~/admin/components/option-select';
import { listEngines } from '../data';
import { SelectOrCreateInputProps } from '~/admin/components/select-or-create-input';

type EngineSelectInputProps = Omit<SelectOrCreateInputProps, 'options'>;

export function EngineSelectInput({ value, ...props }: EngineSelectInputProps) {

    const { data: engineOptions } = useQuery({
        queryKey: ["engines"],
        select: (data) => data?.engines.map(engine => ({ label: `${engine.type} ${engine.size}`, value: engine.id })) || [],
        queryFn: listEngines
    })


    return (
        <OptionSelect
            {...props}
            options={engineOptions}
        />
    );
}