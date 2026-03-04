'use client'

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { addFitment, clearFitment } from "@/lib/data/fitments";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useFitment } from "../hooks/use-fitment";
import { FitmentFormSchema } from "../schema";
import { FitmentForm } from "./fitment-form";

export function FitmentDialog({ children, data }: { children: React.ReactNode, data?: any }) {

    const [openFormDialog, setOpenFormDialog] = useState(false)

    const defaultValues = data ? {
        year: data.year_start,
        make: data.model.make.id,
        model: data.model.id,
        engine: data.engine.id,
    } : undefined

    const makeSearchForm = useForm({
        resolver: zodResolver(FitmentFormSchema as any),
        defaultValues,
    })

    const { handleSubmit } = useFitment(makeSearchForm)

    const onSubmit = handleSubmit((data, state) => {
        addFitment(state!)
        setOpenFormDialog(false)
    })

    const handleClearClick = () => {
        makeSearchForm.reset()
        clearFitment()
    }

    useEffect(() => {
        if (!openFormDialog) {
            makeSearchForm.reset()
        }
    }, [openFormDialog, makeSearchForm])


    return (
        <Dialog open={openFormDialog} onOpenChange={setOpenFormDialog}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={onSubmit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>My Garage</DialogTitle>
                        <DialogDescription>
                            Add your vehicles to find the right parts faster.
                        </DialogDescription>
                    </DialogHeader>

                    <FitmentForm orientation="vertical" form={makeSearchForm} />
                    <DialogFooter>
                        <Button type="submit" variant="default" disabled={!makeSearchForm.formState.isValid}>Add Vehicle</Button>
                        <Button type="button" variant="secondary" onClick={handleClearClick}>Clear</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}