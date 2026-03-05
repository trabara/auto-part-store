import { useQuery } from '@tanstack/react-query';
import OptionSelect from '../../../../components/option-select';
import { SelectOrCreateInputProps } from '../../../../components/select-or-create-input';
import { listEngines } from '../data';

type EngineSelectInputProps = Omit<SelectOrCreateInputProps, 'options'>;

export function EngineSelectInput(props: EngineSelectInputProps) {

    const { data: engineOptions } = useQuery({
        queryKey: ["engines"],
        queryFn: ({ signal }) => listEngines(signal),
        select: ({ engines }) => engines?.map(({ id, tech, type, size, fuel }) => ({ label: tech || `${type} ${size} ${fuel} `, value: id })) || [],
    })

    return (
        <OptionSelect
            {...props}
            options={engineOptions}
        />
    );
}