import { Select } from "@medusajs/ui"

export type OptionSelectProps = {
    className?: string
    placeholder?: string,
    value?: string | number,
    options: { label: string, value: string | number }[] | undefined,
    onChange: (value: string) => void
}

const OptionSelect = ({ placeholder, value, options = [], onChange, ...restProps }: OptionSelectProps) => {
    return (
        <Select value={value?.toString()} onValueChange={onChange} >
            <Select.Trigger {...restProps}>
                <Select.Value placeholder={placeholder} />
            </Select.Trigger>
            <Select.Content>
                {options.map((option) => (
                    <Select.Item key={option.value} value={option.value.toString()}>{option.label}</Select.Item>
                ))}
            </Select.Content>
        </Select>
    )
}

export default OptionSelect