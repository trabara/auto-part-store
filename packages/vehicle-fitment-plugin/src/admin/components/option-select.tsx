import { Select } from "@medusajs/ui"
import { forwardRef } from "react"

export type OptionSelectProps = {
    className?: string
    placeholder?: string,
    value?: string | number,
    options: { label: string, value: string | number }[] | undefined,
    onChange: (value: string) => void
}

const OptionSelect = forwardRef<HTMLButtonElement, OptionSelectProps>(({ placeholder, value, options = [], onChange, ...restProps }, ref) => {
    return (
        <Select  value={value?.toString()} onValueChange={onChange} >
            <Select.Trigger {...restProps} ref={ref}>
                <Select.Value placeholder={placeholder} />
            </Select.Trigger>
            <Select.Content>
                {options.map((option) => (
                    <Select.Item key={option.value} value={option.value.toString()}>{option.label}</Select.Item>
                ))}
            </Select.Content>
        </Select>
    )
})

export default OptionSelect