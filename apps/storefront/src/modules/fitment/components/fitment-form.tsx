'use client'

import { Field, FieldContent, FieldError } from "@/components/ui/field";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/util/cn";
import { Controller, UseFormReturn } from "react-hook-form";
import { useFitment } from "../hooks/use-fitment";
import { FitmentFormType } from "../types";

type FitmentFormProps = {
    form: UseFormReturn<FitmentFormType>
    className?: string
    orientation?: "vertical" | "horizontal"
}

export function FitmentForm({ form, className, orientation = "horizontal" }: FitmentFormProps) {
    const {
        state,
        handleYearChange,
        handleMakeChange,
        handleModelChange,
        handleEngineChange,
    } = useFitment(form)

    return (
        <div className={cn("flex", className, {
            "flex-col space-y-4": orientation === "vertical",
            "flex-row space-x-4": orientation === "horizontal",
        })}>
            <Controller
                name="year"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field>
                        <FieldContent>
                            <Select {...field}
                                value={field.value?.toString()}
                                onValueChange={(value) => {
                                    field.onChange(Number(value))
                                    handleYearChange(value)
                                }} >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 30 }, (_, i) => {
                                        const year = (1990 + i).toString()
                                        return (
                                            <SelectItem key={i} value={year}>{year}</SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </FieldContent>
                        {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                )}
            />

            <Controller
                name="make"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field>
                        <FieldContent>
                            <Select {...field}
                                onValueChange={(value) => {
                                    field.onChange(value)
                                    handleMakeChange(value)
                                }}
                                disabled={state.isPending}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Manufacturer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {state.makes.map(({ value, label }) => (
                                        <SelectItem key={value} value={value}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FieldContent>
                        {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                )}
            />

            <Controller
                name="model"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field>
                        <FieldContent>
                            <Select {...field} onValueChange={(value) => {
                                field.onChange(value)
                                handleModelChange(value)
                            }} disabled={state.isPending}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Model" />
                                </SelectTrigger>
                                <SelectContent>
                                    {state.models.map(({ value, label }) => (
                                        <SelectItem key={value} value={value}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FieldContent>
                        {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                )}
            />

            <Controller
                name="engine"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field>
                        <FieldContent>
                            <Select {...field} onValueChange={(value) => {
                                field.onChange(value);
                                handleEngineChange(value);
                            }} disabled={state.isPending}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Engine" />
                                </SelectTrigger>
                                <SelectContent>
                                    {state.engines.map(({ value, label }) => (
                                        <SelectItem key={value} value={value}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FieldContent>
                        {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                )}
            />
        </div>
    )
}