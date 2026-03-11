import { zodResolver } from "@hookform/resolvers/zod";
import { Button, FocusModal, Heading, Hint, Input, Label } from "@medusajs/ui";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  BODY_STYLE_OPTIONS,
  DOORS_OPTIONS,
  DRIVE_OPTIONS,
  TRANSMISSION_OPTIONS,
} from "../../../../../modules/fitment/constant";
import {
  CreateFitmentInput,
  CreateFitmentInputSchema,
} from "../../../../../modules/fitment/schema";
import OptionSelect from "../../../../components/option-select";
import { useCreateMutation } from "../../../../hooks/use-create-mutation";
import { EngineSelectInput } from "../../engine/components/engine-select";
import { ModelSelectInput } from "../../model/components/model-select-input";
import { createFitment } from "../data";

const CreateFitmentModal = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(CreateFitmentInputSchema),
    defaultValues: {
      year_start: 2000,
      body_style: "SEDAN",
      drive: "FWD",
      transmission: "MANUAL",
      doors: 4,
    },
  });

  const handleClose = () => {
    navigate(-1);
  };

  const createMutation = useCreateMutation({
    invalidateKeys: ["fitments"],
    errorMessage: t("fitment.toast.createError"),
    successMessage: t("fitment.toast.created"),
    createFn: createFitment,
  });

  const handleSubmit = form.handleSubmit((data: CreateFitmentInput) => {
    createMutation.mutate(data);
    handleClose();
  });

  return (
    <FocusModal open onOpenChange={handleClose}>
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
                      onChange={(e) => field.onChange(Number(e.target.value))}
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
                    <Label htmlFor="body_style">
                      {t("fitment.field.bodyStyle")}
                    </Label>
                    <OptionSelect options={BODY_STYLE_OPTIONS} {...field} />
                    {error && <Hint variant="error">{error.message}</Hint>}
                  </div>
                )}
              />
              <Controller
                name="drive"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="drive">{t("fitment.field.drive")}</Label>
                    <OptionSelect options={DRIVE_OPTIONS} {...field} />
                    {error && <Hint variant="error">{error.message}</Hint>}
                  </div>
                )}
              />
              <Controller
                name="transmission"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="transmission">
                      {t("fitment.field.transmission")}
                    </Label>
                    <OptionSelect options={TRANSMISSION_OPTIONS} {...field} />
                    {error && <Hint variant="error">{error.message}</Hint>}
                  </div>
                )}
              />
              <Controller
                name="doors"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="doors">{t("fitment.field.doors")}</Label>
                    <OptionSelect options={DOORS_OPTIONS} {...field} />
                    {error && <Hint variant="error">{error.message}</Hint>}
                  </div>
                )}
              />
              <Controller
                name="model_id"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="model_id">{t("fitment.field.model")}</Label>
                    <ModelSelectInput {...field} />
                    {error && <Hint variant="error">{error.message}</Hint>}
                  </div>
                )}
              />
              <Controller
                name="engine_id"
                control={form.control}
                render={({ field, fieldState: { error } }) => (
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="engine_id">
                      {t("fitment.field.engine")}
                    </Label>
                    <EngineSelectInput {...field} />
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

export default CreateFitmentModal;
