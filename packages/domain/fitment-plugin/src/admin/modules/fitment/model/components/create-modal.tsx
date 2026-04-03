import { zodResolver } from "@hookform/resolvers/zod";
import { Button, FocusModal, Heading, Hint, Input, Label } from "@medusajs/ui";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { CreateModelInput } from "@trabara/core/dtos";
import { CreateModelInputSchema } from "@trabara/core/validations";
import { useCrudContext } from "../../../../context/crud-context";
import { useCreateMutation } from "../../../../hooks/use-create-mutation";
import { MakeSelectInput } from "../../make/components/make-select-input";
import { createModel } from "../data";

const ModelCreateModal = () => {
  const { t } = useTranslation();
  const { isCreate, setIsCreate } = useCrudContext();

  const form = useForm<CreateModelInput>({
    resolver: zodResolver(CreateModelInputSchema),
  });

  const createMutation = useCreateMutation({
    invalidateKeys: ["models"],
    errorMessage: t("model.toast.createError"),
    successMessage: t("model.toast.created"),
    createFn: createModel,
  });

  const handleClose = () => {
    setIsCreate(false);
  };

  const handleSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data);
    handleClose();
  });

  return (
    <FocusModal open={isCreate} onOpenChange={handleClose}>
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
                  {t("model.create.title")}
                </Heading>
                <p className="text-ui-fg-subtle text-sm">
                  {t("model.create.subtitle")}
                </p>
              </div>

              <div className="space-y-4">
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
                      <Hint>{t("model.field.name.hint")}</Hint>
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

export default ModelCreateModal;
