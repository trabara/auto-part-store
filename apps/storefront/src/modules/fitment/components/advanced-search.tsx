'use client'

import { Button } from "@repo/ui/components/button"
import { Field, FieldContent } from "@repo/ui/components/field"
import { Input } from "@repo/ui/components/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs"
import { addFitment } from "@/lib/data/fitments"
import { cn } from "@repo/ui/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight } from "lucide-react"
import { useForm } from 'react-hook-form'
import { useFitment } from "../hooks/use-fitment"
import { FitmentForm } from "./fitment-form"
import { FitmentFormSchema } from "../schema"

export default function AdvancedSearch({ className }: { className?: string }) {
  const fitmentForm = useForm({
    resolver: zodResolver(FitmentFormSchema as any),
  })
  const { handleSubmit } = useFitment(fitmentForm)

  const onSubmit = handleSubmit((data, state) => {
    addFitment(state!)
  })

  return (
    <div className={cn("flex flex-col flex-1 justify-between", className)}>
      <Tabs defaultValue="model" orientation="horizontal">
        <TabsList variant="default" className="w-48">
          <TabsTrigger value="model">Model</TabsTrigger>
          <TabsTrigger value="vin">VIN</TabsTrigger>
          <TabsTrigger value="plate">License Plate</TabsTrigger>
        </TabsList>
        <TabsContent value="model" className="mt-2">
          <h5 className="font-medium mb-4">Search by Vehicle Model</h5>
          <form className="flex flex-col gap-4 lg:items-center lg:flex-row" onSubmit={onSubmit}>
            <FitmentForm form={fitmentForm} className="flex-1" />
            <Button type="submit" className="w-full lg:w-auto self-end">
              Go
              <ArrowRight />
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="vin" className="mt-2">
          <h5 className="font-medium mb-4">Search by VIN</h5>
          <Field>

            <FieldContent>
              <Input
                name="vin"
                type="text"
                placeholder="Vehicle Identification Number"
                className="bg-white"
                required
              />
            </FieldContent>
          </Field>
        </TabsContent>
        <TabsContent value="plate" className="mt-2">
          <h5 className="font-medium mb-4">Search by License Plate</h5>
          <Field>
            <FieldContent>
              <Input
                name="plate"
                type="text"
                placeholder="License Plate Number"
                className="bg-white"
                required
              />
            </FieldContent>
          </Field>
        </TabsContent>
      </Tabs>
    </div>
  )
}
