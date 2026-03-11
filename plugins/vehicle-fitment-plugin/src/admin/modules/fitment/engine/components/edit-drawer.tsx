import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Drawer, Heading, Hint, Input, Label } from "@medusajs/ui";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { LoaderFunctionArgs, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import OptionSelect from "../../../../components/option-select";
import { useUpdateMutation } from "../../../../hooks/use-update-mutation";
import { sdk } from "../../../../lib/sdk";
import {
  ENGINE_FUEL_OPTIONS,
  ENGINE_SIZE_OPTIONS,
  ENGINE_TYPE_OPTIONS,
} from "../../../../../modules/fitment/constant";
import {
  Engine,
  UpdateEngineInput,
  UpdateEngineInputSchema,
} from "../../../../../modules/fitment/schema";
import { updateEngine } from "../data";

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  const { engine } = await sdk.client.fetch<{ engine: Engine }>(
    `/admin/engines/${id}`,
  );
  return { engine };
}

const EngineEditDrawer = ({ engine }: { engine: Engine }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const form = useForm<UpdateEngineInput>({
    resolver: zodResolver(UpdateEngineInputSchema),
    defaultValues: {
      fuel: engine.fuel,
      type: engine.type,
      size: engine.size,
      tech: engine.tech || "",
    },
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
          <Heading level="h2">{t("engine.edit.title")}</Heading>
          <p className="text-ui-fg-subtle text-sm mt-1">
            {t("engine.edit.subtitle")}
          </p>
        </Drawer.Header>
        <Drawer.Body>
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 space-y-6">
              {/* Read-only ID */}
              <div className="space-y-2">
                <Label htmlFor="id" className="text-ui-fg-subtle">
                  {t("engine.field.id")}
                </Label>
                <Input id="id" value={engine.id} disabled />
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

export default EngineEditDrawer;
