import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  FocusModal,
  Heading,
  Hint,
  Input,
  Label,
  Select,
} from "@medusajs/ui";
import { useCreateMutation } from "@repo/admin/hooks/use-create-mutation";
import { CreateFitmentInput } from "@trabara/core/dtos";
import { CreateFitmentInputSchema } from "@trabara/core/validations";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { createFitment } from "../routes/fitments/data";
import EngineSelect from "./engine-select";
import ModelSelect from "./model-select";

const BODY_STYLE_OPTIONS = [
  { label: "Sedan", value: "SEDAN" },
  { label: "SUV", value: "SUV" },
  { label: "Hatchback", value: "HATCHBACK" },
  { label: "Coupe", value: "COUPE" },
  { label: "Convertible", value: "CONVERTIBLE" },
  { label: "Wagon", value: "WAGON" },
  { label: "Van", value: "VAN" },
  { label: "Pickup", value: "PICKUP" },
];

const DRIVE_OPTIONS = [
  { label: "FWD", value: "FWD" },
  { label: "RWD", value: "RWD" },
  { label: "AWD", value: "AWD" },
  { label: "4WD", value: "FOUR_WD" },
];

const TRANSMISSION_OPTIONS = [
  { label: "Manual", value: "MANUAL" },
  { label: "Automatic", value: "AUTOMATIC" },
  { label: "CVT", value: "CVT" },
];

const DOORS_OPTIONS = ["2", "3", "4", "5"];

const FitmentCreateModal = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(CreateFitmentInputSchema),
    defaultValues: {
      year_start: 2000,
      body_style: "SEDAN" as const,
      drive: "FWD" as const,
      transmission: "MANUAL" as const,
      doors: 4,
    },
  });

  const handleClose = () => navigate(-1);

  const createMutation = useCreateMutation({
    invalidateKeys: ["fitments"],
    errorMessage: t("fitment.toast.createError"),
    successMessage: t("fitment.toast.created"),
    createFn: createFitment,
  });

  const handleSubmit = form.handleSubmit((data: CreateFitmentInput) => {
    createMutation.mutate(data as any);
    handleClose();
  });

  return (
    <FocusModal
      open
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <FocusModal.Content asChild>
        <form onSubmit={handleSubmit}>
          <FocusModal.Header />
          <div className="mx-auto max-w-xl py-8 flex-1">
            <div>
              <Heading level="h1">{t("fitment.create.title")}</Heading>
              <Hint>{t("fitment.create.hint")}</Hint>
            </div>

            <div className="mt-8 space-y-6">
              <Controller
                name="year_start"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="year_start">
                      {t("fitment.field.yearStart")}
                    </Label>
                    <Input
                      id="year_start"
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                    {error && <Hint variant="error">{error.message}</Hint>}
                  </div>
                )}
              />
              <Controller
                name="year_end"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="year_end">
                      {t("fitment.field.yearEnd")}
                    </Label>
                    <Input
                      id="year_end"
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                    />
                    {error && <Hint variant="error">{error.message}</Hint>}
                  </div>
                )}
              />
              <Controller
                name="body_style"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <div className="flex flex-col space-y-2">
                    <Label>{t("fitment.field.bodyStyle")}</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <Select.Trigger>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        {BODY_STYLE_OPTIONS.map((o) => (
                          <Select.Item key={o.value} value={o.value}>
                            {o.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                    {error && <Hint variant="error">{error.message}</Hint>}
                  </div>
                )}
              />
              <Controller
                name="drive"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <div className="flex flex-col space-y-2">
                    <Label>{t("fitment.field.drive")}</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <Select.Trigger>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        {DRIVE_OPTIONS.map((o) => (
                          <Select.Item key={o.value} value={o.value}>
                            {o.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                    {error && <Hint variant="error">{error.message}</Hint>}
                  </div>
                )}
              />
              <Controller
                name="transmission"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <div className="flex flex-col space-y-2">
                    <Label>{t("fitment.field.transmission")}</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <Select.Trigger>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        {TRANSMISSION_OPTIONS.map((o) => (
                          <Select.Item key={o.value} value={o.value}>
                            {o.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                    {error && <Hint variant="error">{error.message}</Hint>}
                  </div>
                )}
              />
              <Controller
                name="doors"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <div className="flex flex-col space-y-2">
                    <Label>{t("fitment.field.doors")}</Label>
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <Select.Trigger>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        {DOORS_OPTIONS.map((o) => (
                          <Select.Item key={o} value={o}>
                            {o}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                    {error && <Hint variant="error">{error.message}</Hint>}
                  </div>
                )}
              />
              <Controller
                name="model_id"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <div className="flex flex-col space-y-2">
                    <Label>{t("fitment.field.model")}</Label>
                    <ModelSelect
                      defaultValue={field.value}
                      onChange={field.onChange}
                    />
                    {error && <Hint variant="error">{error.message}</Hint>}
                  </div>
                )}
              />
              <Controller
                name="engine_id"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <div className="flex flex-col space-y-2">
                    <Label>{t("fitment.field.engine")}</Label>
                    <EngineSelect
                      defaultValue={field.value}
                      onChange={field.onChange}
                    />
                    {error && <Hint variant="error">{error.message}</Hint>}
                  </div>
                )}
              />
            </div>
          </div>
          <FocusModal.Footer>
            <Button type="button" variant="secondary" onClick={handleClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit">{t("common.continue")}</Button>
          </FocusModal.Footer>
        </form>
      </FocusModal.Content>
    </FocusModal>
  );
};

export default FitmentCreateModal;
