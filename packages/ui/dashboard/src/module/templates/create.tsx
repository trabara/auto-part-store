import { z } from "@medusajs/framework/zod";
import { Button, clx, FocusModal, Heading, Hint, ProgressTabs } from "@medusajs/ui";
import type { RouteRenderContext } from "@repo/framework/admin";
import { startCase } from "lodash";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSdk } from "../../common/context";
import { Form } from "../../form/components/form";
import { fieldUiOverrides } from "../helpers/field-ui-overrides";
import { relationOverrides } from "../helpers/relation-overrides";
import { useCreateMutation } from "../hooks/use-create-mutation";
import { useWizardForm } from "../hooks/use-wizard-form";
import type { StepConfig } from "../types";
import { entityUrl, featurePath, useFeature } from "../utils/routes";

const contentClass = "flex flex-col gap-y-4 max-w-[720px] w-full";

/**
 * Create form for a feature's entity in a focus modal: a single form, or a
 * wizard when the feature declares `steps`.
 */
export function TemplateCreate(_: RouteRenderContext) {
  const { module, feature, entity, route } = useFeature();
  const sdk = useSdk();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const schema = route.dto as z.ZodObject<any>;
  const name = startCase(entity.name);

  const overrides = useMemo(
    () => ({
      ...relationOverrides(module, feature, schema),
      ...fieldUiOverrides(schema),
      ...(feature.ui.overrides as object),
    }),
    [module, feature, schema],
  );

  const steps = useMemo<StepConfig<any>[]>(
    () =>
      (feature.ui.steps ?? []).map((step) => ({
        id: step.id,
        label: step.label,
        description: step.description,
        schema: schema.pick(Object.fromEntries(step.fields.map((f) => [f, true]))),
      })),
    [feature, schema],
  );

  const create = useCreateMutation({
    invalidateKeys: [entity.modelName],
    errorMessage: `Failed to create ${name}`,
    successMessage: `${name} created`,
    createFn: (body) => sdk.client.fetch(entityUrl(module, entity), { method: "POST", body }),
  });

  const close = () => navigate(featurePath(feature, "list")!, { replace: true });

  const [wizard, wizardAction] = useWizardForm(steps, async (values) => {
    await create.mutateAsync(values);
    close();
  });

  const isWizard = steps.length > 0;
  const activeSchema = isWizard ? wizard.schema : schema;

  const handleSubmit = async (values: any) => {
    if (isWizard) {
      await wizardAction.handleSubmit(values);
      return;
    }
    await create.mutateAsync(values);
    close();
  };

  return (
    <FocusModal open onOpenChange={close}>
      <FocusModal.Content>
        <Form schema={activeSchema as any} overrides={overrides} onSubmit={handleSubmit}>
          {({ renderField, renderSubmitButton, form }, fieldKeys) => {
            const footer = (submitLabel: React.ReactNode, disabled?: boolean) => (
              <FocusModal.Footer>
                <div className="flex items-center justify-end gap-x-2">
                  <Button variant="secondary" size="small" type="button" onClick={close}>
                    {t("common.cancel", "Cancel")}
                  </Button>
                  {renderSubmitButton({ disabled, children: submitLabel })}
                </div>
              </FocusModal.Footer>
            );
            const createLabel = (
              <>
                {t("common.create", "Create")} <span>{name}</span>
              </>
            );

            if (!isWizard) {
              return (
                <div className="flex h-full flex-col">
                  <FocusModal.Header>
                    <FocusModal.Title asChild>
                      <Heading level="h1">
                        {t("common.create", "Create")} {name}
                      </Heading>
                    </FocusModal.Title>
                  </FocusModal.Header>
                  <FocusModal.Body className="relative flex flex-col items-center overflow-y-auto p-16">
                    <div className={contentClass}>{fieldKeys.map((key) => renderField(key))}</div>
                  </FocusModal.Body>
                  {footer(createLabel, !form.formState.isValid)}
                </div>
              );
            }

            return (
              <ProgressTabs
                value={wizard.step}
                className="flex h-full flex-col"
                onValueChange={(tabId) => wizardAction.handleChange(tabId, form)}
              >
                <FocusModal.Header>
                  <FocusModal.Title className="sr-only">
                    {t("common.create", "Create")} {name}
                  </FocusModal.Title>
                  <ProgressTabs.List className="-my-2 w-full border-l">
                    {steps.map(({ id, label }) => (
                      <ProgressTabs.Trigger key={id} value={id}>
                        {label}
                      </ProgressTabs.Trigger>
                    ))}
                  </ProgressTabs.List>
                </FocusModal.Header>
                <FocusModal.Body className="relative flex flex-col items-center overflow-y-auto p-16">
                  {steps.map((step) =>
                    wizard.step !== step.id ? null : (
                      <ProgressTabs.Content key={step.id} value={step.id} className={clx(contentClass)}>
                        <div className="flex flex-col gap-y-1">
                          <Heading level="h1">{step.label}</Heading>
                          {step.description && <Hint>{step.description}</Hint>}
                        </div>
                        {wizard.fields.map((key) => renderField(key))}
                      </ProgressTabs.Content>
                    ),
                  )}
                </FocusModal.Body>
                {footer(wizard.hasNext ? t("common.next", "Next") : createLabel)}
              </ProgressTabs>
            );
          }}
        </Form>
      </FocusModal.Content>
    </FocusModal>
  );
}
