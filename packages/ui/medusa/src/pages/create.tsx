import { Button, FocusModal, Heading, Hint, ProgressTabs } from "@medusajs/ui";
import { getZodShape } from "@repo/utils";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Form } from "../components/form";
import { useCreateMutation } from "../hooks/use-create-mutation";
import { useWizardForm } from "../hooks/use-wizard-form";
import { StepConfig } from "../lib/types";
import { cn } from "../lib/utils";
import { useSdk } from "../provider/sdk-provider";
import { useMedusaCrud } from "../context/crud";

const MedusaCreatePage = <T extends Record<string, any>>() => {
  const sdk = useSdk();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { config } = useMedusaCrud();

  const createAction = (data: T): Promise<void> =>
    sdk.client.fetch(`/admin${config.path}`, { method: "POST", body: data });

  const mutate = useCreateMutation({
    invalidateKeys: [config.path],
    errorMessage: `Failed to create ${config.name}`,
    successMessage: `Successfully created ${config.name}`,
    createFn: createAction,
  });

  const dispose = () => {
    navigate(`${config.path}`, { replace: true });
  };

  const handleSubmit = async (values: T) => {
    if (config.createSteps && config.createSteps.length > 0) {
      await action.handleSubmit(values);
    } else {
      await mutate.mutateAsync(values);
    }
    dispose();
  };

  const [wizard, action] = useWizardForm(
    config.createSteps,
    async (values: T) => {
      await mutate.mutateAsync(values);
      dispose();
    },
  );

  const activeSchema = useMemo(
    () =>
      config.createSteps && config.createSteps.length > 0
        ? wizard.schema
        : config.createSchema,
    [wizard.schema, config.createSchema, config.createSteps],
  );

  if (!activeSchema) {
    throw new Error("Schema is required if no steps are provided");
  }

  const styles = {
    body: {
      wrapper: {
        base: "relative flex flex-col items-center p-16",
      },
      content: {
        base: "flex w-full flex-col",
        default: "max-w-[720px] w-full gap-y-8",
        full: "flex-1",
      },
    },
    header: {
      base: "flex flex-col gap-y-1",
      default: "flex flex-col gap-y-1",
      full: "flex flex-col gap-y-2",
    },
  };

  const getContentStyle = (step: StepConfig<T>) =>
    cn(
      styles.body.content.base,
      styles.body.content[step.display ?? "default"],
    );

  const getHeaderStyle = (step: StepConfig<T>) =>
    cn(styles.header.base, styles.header[step.display ?? "default"]);

  return (
    <FocusModal open={true} onOpenChange={dispose}>
      <FocusModal.Content>
        <Form
          overrides={config.createFields}
          schema={activeSchema}
          onSubmit={handleSubmit}
        >
          {({ renderField, renderSubmitButton, form }) => {
            if (config.createSteps && config.createSteps.length > 0) {
              return (
                <ProgressTabs
                  value={wizard.step}
                  className="flex flex-col h-full"
                  onValueChange={(tabId) => action.handleChange(tabId, form)}
                >
                  <FocusModal.Header>
                    <ProgressTabs.List className="-my-2 w-full border-l">
                      {config.createSteps.map(({ id, label }) => (
                        <ProgressTabs.Trigger key={id} value={id}>
                          {label}
                        </ProgressTabs.Trigger>
                      ))}
                    </ProgressTabs.List>
                  </FocusModal.Header>

                  <FocusModal.Body className={styles.body.wrapper.base}>
                    {config.createSteps.map((step) => {
                      if (wizard.step !== step.id) {
                        return <React.Fragment key={step.id} />;
                      }
                      return (
                        <ProgressTabs.Content
                          key={step.id}
                          value={step.id}
                          className={getContentStyle(step)}
                        >
                          {(step.header === undefined ||
                            step.header === true) && (
                            <div className={getHeaderStyle(step)}>
                              <Heading level="h1" className="">
                                {step.label}
                              </Heading>
                              {step.description && (
                                <Hint>{step.description}</Hint>
                              )}
                            </div>
                          )}

                          {wizard.fields.map((key) => renderField(key))}
                        </ProgressTabs.Content>
                      );
                    })}
                  </FocusModal.Body>
                  <FocusModal.Footer>
                    <div className="flex items-center justify-end gap-x-2">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={dispose}
                      >
                        {t("common.cancel")}
                      </Button>
                      {renderSubmitButton({
                        disabled: !form.formState.isValid && !wizard.hasNext,
                        children: wizard.hasNext ? (
                          t("common.next")
                        ) : (
                          <>
                            {t("common.create")}{" "}
                            <span className="capitalize">{config.name}</span>
                          </>
                        ),
                      })}
                    </div>
                  </FocusModal.Footer>
                </ProgressTabs>
              );
            }
            const shape = getZodShape(activeSchema);
            const fieldKeys = Object.keys(shape);
            return (
              <div className="flex flex-col h-full">
                <FocusModal.Header>
                  <FocusModal.Title>
                    <Heading level="h1">
                      Create <span className="capitalize">{config.name}</span>
                    </Heading>
                  </FocusModal.Title>
                </FocusModal.Header>
                <FocusModal.Body className={styles.body.wrapper.base}>
                  <div className={styles.body.content.default}>
                    {
                      fieldKeys.map((key) =>
                        renderField(key),
                      ) as unknown as React.ReactNode
                    }
                  </div>
                </FocusModal.Body>
                <FocusModal.Footer>
                  <div className="flex items-center justify-end gap-x-2">
                    <Button variant="secondary" size="small" onClick={dispose}>
                      {t("common.cancel")}
                    </Button>
                    {renderSubmitButton({
                      // disabled: !form.formState.isValid,
                      children: (
                        <>
                          {t("common.create")}{" "}
                          <span className="capitalize">{config.name}</span>
                        </>
                      ),
                    })}
                  </div>
                </FocusModal.Footer>
              </div>
            );
          }}
        </Form>
      </FocusModal.Content>
    </FocusModal>
  );
};

export default MedusaCreatePage;
