import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Drawer, Heading, Hint, Input, Label } from "@medusajs/ui";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  UpdateModelInput,
  UpdateModelInputSchema,
} from "../../../../../modules/fitment/schema";
import { useCrudContext } from "../../../../context/crud-context";
import { useUpdateMutation } from "../../../../hooks/use-update-mutation";
import { MakeSelectInput } from "../../make/components/make-select-input";
import { updateModel } from "../data";
import { ModelWithFitments } from "../types";

const ModelEditDrawer = () => {
  const { t } = useTranslation();
  const {
    entity: model,
    isEdit,
    setIsEdit,
  } = useCrudContext<ModelWithFitments>();

  const form = useForm<UpdateModelInput>({
    resolver: zodResolver(UpdateModelInputSchema),
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

  const handleSubmit = form.handleSubmit((data) => {
    updateMutation.mutate(data);
    setIsEdit(false);
  });

  return (
    <Drawer open={isEdit} onOpenChange={setIsEdit}>
      <Drawer.Content asChild>
        <form onSubmit={handleSubmit} className="flex flex-col">
          <Drawer.Header>
            <Heading level="h2">{t("model.edit.title")}</Heading>
            <p className="text-ui-fg-subtle text-sm mt-1">
              {t("model.edit.subtitle")}
            </p>
          </Drawer.Header>
          <Drawer.Body>
            <div className="mt-4 flex flex-col gap-y-4">
              {/* Read-only ID */}
              <div className="space-y-2">
                <Label htmlFor="id" className="text-ui-fg-subtle">
                  {t("model.field.id")}
                </Label>
                <Input id="id" value={model?.id ?? ""} disabled />
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
          </Drawer.Body>
          <Drawer.Footer>
            <Button
              variant="secondary"
              onClick={() => setIsEdit(false)}
              type="button"
              disabled={updateMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={updateMutation.isPending}
            >
              {t("common.save")}
            </Button>
          </Drawer.Footer>
        </form>
      </Drawer.Content>
    </Drawer>
  );
};

export default ModelEditDrawer;
