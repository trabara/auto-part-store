"use client"

import { Button } from "@/components/ui/button"
import { Field, FieldContent } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { addFitment } from "@/lib/data/fitments"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight } from "lucide-react"
import { useForm } from "react-hook-form"
import { useFitment } from "../hooks/use-fitment"
import { FitmentForm } from "./fitment-form"
import { FitmentFormSchema } from "../schema"
import { FitmentFormType } from "../types"
import { useTranslations } from "next-intl"

export default function AdvancedSearch({ className }: { className?: string }) {
  const t = useTranslations("fitment")
  const fitmentForm = useForm<FitmentFormType>({
    resolver: zodResolver(FitmentFormSchema as any),
  })
  const { handleSubmit } = useFitment(fitmentForm)

  const onSubmit = handleSubmit((data, state) => {
    addFitment(state!)
  })

  return (
    <div className={cn("flex flex-col flex-1 justify-between", className)}>
      <Tabs defaultValue="model" orientation="horizontal">
        <TabsList variant="default" className="rtl:self-end">
          <TabsTrigger value="model">{t("tabModel")}</TabsTrigger>
          <TabsTrigger value="vin">{t("tabVin")}</TabsTrigger>
          <TabsTrigger value="plate">{t("tabPlate")}</TabsTrigger>
        </TabsList>
        <TabsContent value="model" className="mt-2">
          <h5 className="font-medium mb-4 rtl:text-right">{t("searchByModel")}</h5>
          <form
            className="flex flex-col gap-4 xl:items-center xl:flex-row rtl:xl:flex-row-reverse"
            onSubmit={onSubmit}
          >
            <FitmentForm form={fitmentForm} className="flex-1 rtl:xl:flex-row-reverse xl:flex-row xl:gap-4 xl:space-y-0" />
            <Button type="submit" className="w-full xl:w-auto self-start flex flex-row-reverse">
              {t("go")}
              <ArrowRight className="ml-2 rtl:rotate-180" />
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="vin" className="mt-2">
          <h5 className="font-medium mb-4 rtl:text-right">{t("searchByVin")}</h5>
          <Field>
            <FieldContent>
              <Input
                name="vin"
                type="text"
                placeholder={t("vinPlaceholder")}
                required
              />
            </FieldContent>
          </Field>
        </TabsContent>
        <TabsContent value="plate" className="mt-2">
          <h5 className="font-medium mb-4 rtl:text-right">{t("searchByPlate")}</h5>
          <Field>
            <FieldContent>
              <Input
                name="plate"
                type="text"
                placeholder={t("platePlaceholder")}
                required
              />
            </FieldContent>
          </Field>
        </TabsContent>
      </Tabs>
    </div>
  )
}
