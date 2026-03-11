import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Drawer, Heading, Hint, Input, Label } from "@medusajs/ui";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Model,
  UpdateModelInput,
  UpdateModelInputSchema,
} from "../../../../../modules/fitment/schema";
import { useUpdateMutation } from "../../../../hooks/use-update-mutation";
import { MakeSelectInput } from "../../make/components/make-select-input";
import { updateModel } from "../data";

const ModelEdit = ({ model }: { model?: Model }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const form = useForm<UpdateModelInput>({
    resolver: zodResolver(UpdateModelInputSchema),
    defaultValues: {
      name: model?.name,
      make_id: model?.make.id,
    },
  });

  useEffect(() => {
    if (model) {
      form.reset({
        name: model.name,
        make_id: model.make.id,
      });
    }
  }, [model, form]);

  const updateMutation = useUpdateMutation({
    invalidateKeys: ["models"],
    successMessage: t("model.toast.updated"),
    errorMessage: t("model.toast.updateError"),
    updateFn: updateModel(model?.id),
  });

  const handleClose = () => {
    navigate(-1);
  };

  const handleSubmit = form.handleSubmit((data) => {
    updateMutation.mutate(data);
  });

  return (
    <Drawer open onOpenChange={handleClose}>
      <Drawer.Content>
        <Drawer.Header>
          <Heading level="h2">{t("model.edit.title")}</Heading>
          <p className="text-ui-fg-subtle text-sm mt-1">
            {t("model.edit.subtitle")}
          </p>
        </Drawer.Header>
        <Drawer.Body>
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 space-y-6">
              {/* Read-only ID */}
              <div className="space-y-2">
                <Label htmlFor="id" className="text-ui-fg-subtle">
                  {t("model.field.id")}
                </Label>
                <Input id="id" value={model?.id} disabled />
              </div>

              {/* Make Select */}
              <Controller
                control={form.control}
                name="make_id"
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="make_id" className="font-medium">
                      {t("model.field.make")}{" "}
                      <span className="text-ui-fg-error">*</span>
                    </Label>
                    <MakeSelectInput
                      placeholder={t("model.field.make.placeholder")}
                      {...field}
                    />
                    {fieldState.error && (
                      <Hint variant="error">{fieldState.error.message}</Hint>
                    )}
                    <Hint>{t("model.field.make.hint")}</Hint>
                  </div>
                )}
              />

              {/* Editable Name */}
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-medium">
                      {t("model.field.name")}{" "}
                      <span className="text-ui-fg-error">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder={t("model.field.name.placeholder")}
                      aria-invalid={!!fieldState.error}
                      {...field}
                    />
                    {fieldState.error && (
                      <Hint variant="error">{fieldState.error.message}</Hint>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-x-2 border-t pt-4 mt-6">
              <Button variant="secondary" onClick={handleClose} type="button">
                {t("common.cancel")}
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={updateMutation.isPending}
              >
                {t("common.save")}
              </Button>
            </div>
          </form>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  );
};

export default ModelEdit;
