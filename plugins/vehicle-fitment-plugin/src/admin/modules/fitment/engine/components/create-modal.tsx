import { zodResolver } from "@hookform/resolvers/zod";
import { Button, FocusModal, Heading, Hint, Input, Label } from "@medusajs/ui";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ENGINE_FUEL_OPTIONS,
  ENGINE_SIZE_OPTIONS,
  ENGINE_TYPE_OPTIONS,
} from "../../../../../modules/fitment/constant";
import { CreateEngineInputSchema } from "../../../../../modules/fitment/schema";
import OptionSelect from "../../../../components/option-select";
import { useCreateMutation } from "../../../../hooks/use-create-mutation";
import { createEngine } from "../data";

const EngineCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(CreateEngineInputSchema),
    defaultValues: {
      fuel: "GASOLINE",
      type: "I4",
      size: "1.0",
      tech: "",
    },
  });

  const createMutation = useCreateMutation({
    invalidateKeys: ["fitment", "engines"],
    errorMessage: t("engine.toast.createError"),
    successMessage: t("engine.toast.created"),
    createFn: createEngine,
  });

  const handleClose = () => {
    navigate(-1);
  };

  const handleSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data);
    handleClose();
  });

  return (
    <FocusModal open onOpenChange={handleClose}>
      <FocusModal.Content>
        <form onSubmit={handleSubmit}>
          <FocusModal.Header>
            <div className="flex items-center justify-end gap-x-2">
              <Button variant="secondary" size="small" onClick={handleClose}>
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                size="small"
                isLoading={createMutation.isPending}
              >
                {t("common.create")}
              </Button>
            </div>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-col items-center py-16">
            <div className="w-full max-w-lg space-y-8">
              <div className="flex flex-col items-center text-center">
                <Heading level="h1" className="mb-2">
                  {t("engine.create.title")}
                </Heading>
                <p className="text-ui-fg-subtle text-sm">
                  {t("engine.create.subtitle")}
                </p>
              </div>

              <div className="space-y-4">
                <Controller
                  control={form.control}
                  name="fuel"
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="fuel" className="font-medium">
                        {t("engine.field.fuel")}{" "}
                        <span className="text-ui-fg-error">*</span>
                      </Label>
                      <OptionSelect
                        placeholder={t("engine.field.fuel.placeholder")}
                        options={ENGINE_FUEL_OPTIONS}
                        {...field}
                      />
                      {fieldState.error && (
                        <Hint variant="error">{fieldState.error.message}</Hint>
                      )}
                    </div>
                  )}
                />

                <Controller
                  control={form.control}
                  name="type"
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="type" className="font-medium">
                        {t("engine.field.type")}{" "}
                        <span className="text-ui-fg-error">*</span>
                      </Label>
                      <OptionSelect
                        placeholder={t("engine.field.type.placeholder")}
                        options={ENGINE_TYPE_OPTIONS}
                        {...field}
                      />
                      {fieldState.error && (
                        <Hint variant="error">{fieldState.error.message}</Hint>
                      )}
                    </div>
                  )}
                />

                <Controller
                  control={form.control}
                  name="size"
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="size" className="font-medium">
                        {t("engine.field.size")}{" "}
                        <span className="text-ui-fg-error">*</span>
                      </Label>
                      <OptionSelect
                        placeholder={t("engine.field.size.placeholder")}
                        options={ENGINE_SIZE_OPTIONS}
                        {...field}
                      />
                      {fieldState.error && (
                        <Hint variant="error">{fieldState.error.message}</Hint>
                      )}
                      <Hint>{t("engine.field.size.hint")}</Hint>
                    </div>
                  )}
                />

                <Controller
                  control={form.control}
                  name="tech"
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="tech" className="font-medium">
                        {t("engine.field.tech")}
                      </Label>
                      <Input
                        id="tech"
                        placeholder={t("engine.field.tech.placeholder")}
                        aria-invalid={!!fieldState.error}
                        {...field}
                      />
                      {fieldState.error && (
                        <Hint variant="error">{fieldState.error.message}</Hint>
                      )}
                      <Hint>{t("engine.field.tech.hint")}</Hint>
                    </div>
                  )}
                />
              </div>
            </div>
          </FocusModal.Body>
        </form>
      </FocusModal.Content>
    </FocusModal>
  );
};

export default EngineCreate;
