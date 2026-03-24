"use client"

import { Field, FieldContent, FieldError } from "@repo/ui/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"
import { cn } from "@repo/ui/lib/utils"
import { useTranslations } from "next-intl"
import { Controller, UseFormReturn } from "react-hook-form"
import { useFitment } from "../hooks/use-fitment"
import { FitmentFormType } from "../types"

type FitmentFormProps = {
  form: UseFormReturn<FitmentFormType>
  className?: string
}

export function FitmentForm({
  form,
  className,
}: FitmentFormProps) {
  const t = useTranslations("fitment")
  const {
    state,
    handleYearChange,
    handleMakeChange,
    handleModelChange,
    handleEngineChange,
  } = useFitment(form)

  return (
    <div
      className={cn(
        "flex flex-col space-y-4",
        className
      )}
    >
      <Controller
        name="year"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldContent>
              <Select
                {...field}
                value={field.value?.toString()}
                onValueChange={(value) => {
                  field.onChange(Number(value))
                  handleYearChange(value)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("selectYear")} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 30 }, (_, i) => {
                    const year = (1990 + i).toString()
                    return (
                      <SelectItem key={i} value={year}>
                        {year}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </FieldContent>
            {fieldState.invalid && <FieldError className="rtl:text-right" errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="make"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldContent>
              <Select
                {...field}
                disabled={state.isPending}
                onValueChange={(value) => {
                  field.onChange(value)
                  handleMakeChange(value)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("selectManufacturer")} />
                </SelectTrigger>
                <SelectContent>
                  {state.makes.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
            {fieldState.invalid && <FieldError className="rtl:text-right" errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="model"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldContent>
              <Select
                {...field}
                disabled={state.isPending}
                onValueChange={(value) => {
                  field.onChange(value)
                  handleModelChange(value)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("selectModel")} />
                </SelectTrigger>
                <SelectContent>
                  {state.models.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
            {fieldState.invalid && <FieldError className="rtl:text-right" errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="engine"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldContent>
              <Select
                {...field}
                disabled={state.isPending}
                onValueChange={(value) => {
                  field.onChange(value)
                  handleEngineChange(value)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("selectEngine")} />
                </SelectTrigger>
                <SelectContent>
                  {state.engines.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
            {fieldState.invalid && <FieldError className="rtl:text-right" errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </div>
  )
}
