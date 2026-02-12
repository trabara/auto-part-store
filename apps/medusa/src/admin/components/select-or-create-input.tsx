import { clx, Hint, Input, Switch } from "@medusajs/ui"
import { forwardRef, useEffect, useRef, useState } from "react"
import OptionSelect, { OptionSelectProps } from './select'

type SelectOrCreateInputProps = OptionSelectProps & {
    error?: string

}
const SelectOrCreateInput = forwardRef<HTMLInputElement, SelectOrCreateInputProps>(({ className, onChange, error, options = [], ...restProps }, ref) => {
    const [isNew, setIsNew] = useState(!!restProps.value)
    const textInput = useRef<HTMLInputElement>(null)
    useEffect(() => {
        if (isNew) {
            setTimeout(() => {
                textInput.current?.focus()
            }, 100)
        }
    }, [isNew])
    const isInvalid = !!error
    return (
        <div ref={ref} className={clx("space-y-2", className)}>
            {
                isNew ? (
                    <Input aria-invalid={isInvalid} ref={textInput} className="w-full" onChange={(e) => onChange(e.target.value)} {...restProps} />
                ) : (
                    <OptionSelect aria-invalid={isInvalid} options={options} onChange={onChange} {...restProps} />
                )
            }
            <div className={clx("flex items-center", { "justify-between": isInvalid, "justify-end": !isInvalid })}>
                {error && <Hint variant="error">{error}</Hint>}
                <div className="flex gap-x-2 items-center">
                    <Hint>{isNew ? "Creating a new option" : "Select an existing option"}</Hint>
                    <Switch checked={isNew} onCheckedChange={setIsNew} />
                </div>
            </div>


        </div>
    )
})

export default SelectOrCreateInput