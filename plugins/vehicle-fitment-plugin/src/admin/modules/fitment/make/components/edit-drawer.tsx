import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Drawer, Heading, Hint, Input, Label } from "@medusajs/ui";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  UpdateMakeInput,
  UpdateMakeInputSchema,
} from "../../../../../modules/fitment/schema";
import { useCrudContext } from "../../../../context/crud-context";
import { useUpdateMutation } from "../../../../hooks/use-update-mutation";
import { updateMake } from "../data";
import { MakeWithModels } from "../types";

const MakeEditDrawer = () => {
  const { t } = useTranslation();
  const { entity: make, isEdit, setIsEdit } = useCrudContext<MakeWithModels>();

  const form = useForm<UpdateMakeInput>({
    resolver: zodResolver(UpdateMakeInputSchema),
  });

  useEffect(() => {
    if (make) {
      form.reset({
        name: make.name,
      });
    }
  }, [make, form]);

  const updateMutation = useUpdateMutation({
    invalidateKeys: ["makes"],
    errorMessage: t("make.toast.updateError"),
    successMessage: t("make.toast.updated"),
    updateFn: updateMake(make?.id),
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
            <Heading level="h2">{t("make.edit.title")}</Heading>
            <p className="text-ui-fg-subtle text-sm mt-1">
              {t("make.edit.subtitle")}
            </p>
          </Drawer.Header>
          <Drawer.Body>
            <div className="mt-4 flex flex-col gap-y-4">
              {/* Read-only ID */}
              <div className="space-y-2">
                <Label htmlFor="id" className="text-ui-fg-subtle">
                  {t("make.field.id")}
                </Label>
                <Input id="id" value={make?.id ?? ""} disabled />
              </div>

              {/* Editable Name */}
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
                  </div>
                )}
              />

              {/* Model Count Info */}
              {make?.models && make.models.length > 0 && (
                <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-4">
                  <p className="text-sm text-ui-fg-subtle">
                    {t("make.models.associated_one", {
                      count: make.models.length,
                    })}
                  </p>
                </div>
              )}
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

export default MakeEditDrawer;
