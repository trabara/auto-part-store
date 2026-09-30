import {
  Button,
  clx,
  FocusModal,
  Heading,
  Hint,
  ProgressTabs,
} from "@medusajs/ui";
import { getZodShape } from "@repo/utils";
import { startCase } from "lodash";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSdk } from "../../common/context";
import { Form } from "../../form/components/form";
import { useModule } from "../context/module";
import { useCreateMutation } from "../hooks/use-create-mutation";
import { useWizardForm } from "../hooks/use-wizard-form";
import { CreatePageConfig, StepConfig } from "../types";

const CreateFeature = ({
  config,
  entity,
}: {
  config: CreatePageConfig;
  entity: string;
}) => {
  const sdk = useSdk();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const module = useModule();
  const createAction = (data: any): Promise<void> =>
    sdk.client.fetch(`/admin${config.path}`, {
      method: "POST",
      body: data,
    });

  const entityName = startCase(entity);

  const mutate = useCreateMutation({
    invalidateKeys: [config!.path!],
    errorMessage: `Failed to create ${entityName}`,
    successMessage: `Successfully created ${entityName}`,
    createFn: createAction,
  });

  const dispose = () => {
    navigate(`${config.path}`, { replace: true });
  };

  const handleSubmit = async (values: any) => {
    if (config.steps && config.steps.length > 0) {
      await action.handleSubmit(values);
    } else {
      await mutate.mutateAsync(values);
    }
    dispose();
  };

  const [wizard, action] = useWizardForm(config.steps as [], async (values) => {
    await mutate.mutateAsync(values);
    dispose();
  });

  const activeSchema = useMemo(
    () =>
      config.steps && config.steps.length > 0 ? wizard.schema : config.schema,
    [wizard.schema, config.schema, config.steps],
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
        base: "flex flex-col gap-y-4",
        default: "max-w-[720px] w-full",
        full: "flex-1",
      },
    },
    header: {
      base: "flex flex-col gap-y-1",
      default: "flex flex-col gap-y-1",
      full: "flex flex-col gap-y-2",
    },
  };

  const getContentStyle = (step: StepConfig) =>
    clx(
      styles.body.content.base,
      styles.body.content[step.display ?? "default"],
    );

  const getHeaderStyle = (step: StepConfig) =>
    clx(styles.header.base, styles.header[step.display ?? "default"]);

  const overrideFields = useMemo(() => {
    const fields =
      typeof config.fields === "function" ? config.fields(t) : config.fields;

    return {
      ...module.buildRelationFields(entity, activeSchema),
      ...fields,
    };
  }, [config, t, entity, activeSchema]);

  return (
    <FocusModal open={true} onOpenChange={dispose}>
      <FocusModal.Content>
        <Form
          overrides={overrideFields}
          schema={activeSchema}
          onSubmit={handleSubmit}
        >
          {({ renderField, renderSubmitButton, form }) => {
            if (config.steps && config.steps.length > 0) {
              return (
                <ProgressTabs
                  value={wizard.step}
                  className="flex flex-col h-full"
                  onValueChange={(tabId) => action.handleChange(tabId, form)}
                >
                  <FocusModal.Header>
                    <ProgressTabs.List className="-my-2 w-full border-l">
                      {config.steps.map(({ id, label }) => (
                        <ProgressTabs.Trigger key={id} value={id}>
                          {label}
                        </ProgressTabs.Trigger>
                      ))}
                    </ProgressTabs.List>
                  </FocusModal.Header>

                  <FocusModal.Body className={styles.body.wrapper.base}>
                    {config.steps.map((step) => {
                      if (wizard.step !== step.id) {
                        return <React.Fragment key={step.id} />;
                      }
                      const stepCn = getContentStyle(step);

                      return (
                        <ProgressTabs.Content
                          key={step.id}
                          value={step.id}
                          className={stepCn}
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
                            <span className="capitalize">{entityName}</span>
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
                    <Heading level="h1">{config.getTitle()}</Heading>
                  </FocusModal.Title>
                </FocusModal.Header>
                <FocusModal.Body className={styles.body.wrapper.base}>
                  <div
                    className={clx(
                      styles.body.content.base,
                      styles.body.content.default,
                    )}
                  >
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
                          <span className="capitalize">{entityName}</span>
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

export default CreateFeature;
