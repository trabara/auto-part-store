"use client"

import { Button } from "@repo/ui/components/button"
import { Field, FieldContent } from "@repo/ui/components/field"
import { Input } from "@repo/ui/components/input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs"
import { addFitment } from "@/lib/data/fitments"
import { cn } from "@repo/ui/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight } from "lucide-react"
import { useForm } from "react-hook-form"
import { useFitment } from "../hooks/use-fitment"
import { FitmentForm } from "./fitment-form"
import { FitmentFormSchema } from "../schema"
import { useTranslations } from "next-intl"

export default function AdvancedSearch({ className }: { className?: string }) {
  const t = useTranslations("fitment")
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
        <TabsList variant="default">
          <TabsTrigger value="model">{t("tabModel")}</TabsTrigger>
          <TabsTrigger value="vin">{t("tabVin")}</TabsTrigger>
          <TabsTrigger value="plate">{t("tabPlate")}</TabsTrigger>
        </TabsList>
        <TabsContent value="model" className="mt-2">
          <h5 className="font-medium mb-4">{t("searchByModel")}</h5>
          <form
            className="flex flex-col gap-4 xl:items-center xl:flex-row"
            onSubmit={onSubmit}
          >
            <FitmentForm form={fitmentForm} className="flex-1" />
            <Button type="submit" className="w-full xl:w-auto self-end">
              {t("go")}
              <ArrowRight className="ml-2" />
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="vin" className="mt-2">
          <h5 className="font-medium mb-4">{t("searchByVin")}</h5>
          <Field>
            <FieldContent>
              <Input
                name="vin"
                type="text"
                placeholder={t("vinPlaceholder")}
                className="bg-white"
                required
              />
            </FieldContent>
          </Field>
        </TabsContent>
        <TabsContent value="plate" className="mt-2">
          <h5 className="font-medium mb-4">{t("searchByPlate")}</h5>
          <Field>
            <FieldContent>
              <Input
                name="plate"
                type="text"
                placeholder={t("platePlaceholder")}
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
