import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Drawer, Heading, Hint, Input, Label } from "@medusajs/ui";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import OptionSelect from "../../../../components/option-select";
import { useCrudContext } from "../../../../context/crud-context";
import { useUpdateMutation } from "../../../../hooks/use-update-mutation";
import {
  ENGINE_FUEL_OPTIONS,
  ENGINE_SIZE_OPTIONS,
  ENGINE_TYPE_OPTIONS,
} from "../../../../../modules/fitment/constant";
import { Engine, UpdateEngineInput } from "@trabara/core/dtos";
import { UpdateEngineInputSchema } from "@trabara/core/validations";
import { updateEngine } from "../data";

const EngineEditDrawer = () => {
  const { t } = useTranslation();
  const { entity: engine, isEdit, setIsEdit } = useCrudContext<Engine>();

  const form = useForm<UpdateEngineInput>({
    resolver: zodResolver(UpdateEngineInputSchema),
  });

  useEffect(() => {
    if (engine) {
      form.reset({
        fuel: engine.fuel,
        type: engine.type,
        size: engine.size,
        tech: engine.tech || "",
      });
    }
  }, [engine, form]);

  const updateMutation = useUpdateMutation({
    invalidateKeys: ["engines"],
    errorMessage: t("engine.toast.updateError"),
    successMessage: t("engine.toast.updated"),
    updateFn: updateEngine(engine?.id),
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
            <Heading level="h2">{t("engine.edit.title")}</Heading>
            <p className="text-ui-fg-subtle text-sm mt-1">
              {t("engine.edit.subtitle")}
            </p>
          </Drawer.Header>
          <Drawer.Body>
            <div className="mt-4 flex flex-col gap-y-4">
              {/* Read-only ID */}
              <div className="space-y-2">
                <Label htmlFor="id" className="text-ui-fg-subtle">
                  {t("engine.field.id")}
                </Label>
                <Input id="id" value={engine?.id ?? ""} disabled />
              </div>

              {/* Fuel Type */}
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

              {/* Engine Type */}
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

              {/* Engine Size */}
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
                    <Hint>{t("engine.field.size.hintShort")}</Hint>
                  </div>
                )}
              />

              {/* Technology */}
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

export default EngineEditDrawer;
