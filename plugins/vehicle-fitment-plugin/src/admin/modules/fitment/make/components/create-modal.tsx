import { zodResolver } from "@hookform/resolvers/zod";
import { Button, FocusModal, Heading, Hint, Input, Label } from "@medusajs/ui";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CreateMakeInput,
  CreateMakeInputSchema,
} from "../../../../../modules/fitment/schema";
import { useCreateMutation } from "../../../../hooks/use-create-mutation";
import { createMake } from "../data";

const MakeCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const form = useForm<CreateMakeInput>({
    resolver: zodResolver(CreateMakeInputSchema),
  });

  const createMutation = useCreateMutation({
    invalidateKeys: ["makes"],
    errorMessage: t("make.toast.createError"),
    successMessage: t("make.toast.created"),
    createFn: createMake,
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
                  {t("make.create.title")}
                </Heading>
                <p className="text-ui-fg-subtle text-sm">
                  {t("make.create.subtitle")}
                </p>
              </div>

              <div className="space-y-4">
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="name" className="font-medium">
                        {t("make.field.name")}{" "}
                        <span className="text-ui-fg-error">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder={t("make.field.name.placeholder")}
                        aria-invalid={!!fieldState.error}
                        autoFocus
                        {...field}
                      />
                      {fieldState.error && (
                        <Hint variant="error">{fieldState.error.message}</Hint>
                      )}
                      <Hint>{t("make.field.name.hint")}</Hint>
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

export default MakeCreate;
