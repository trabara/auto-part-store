import { useQuery } from '@tanstack/react-query';
import OptionSelect from '~/admin/components/option-select';
import { SelectOrCreateInputProps } from '~/admin/components/select-or-create-input';
import { listEngines } from '../data';

type EngineSelectInputProps = Omit<SelectOrCreateInputProps, 'options'>;

export function EngineSelectInput(props: EngineSelectInputProps) {

    const { data: engineOptions } = useQuery({
        queryKey: ["engines"],
        queryFn: ({ signal }) => listEngines(signal),
        select: ({ engines }) => engines?.map(engine => ({ label: engine.tech || `${engine.type} ${engine.size} ${engine.fuel} `, value: engine.id })) || [],
    })


    return (
        <OptionSelect
            {...props}
            options={engineOptions}
        />
    );
}