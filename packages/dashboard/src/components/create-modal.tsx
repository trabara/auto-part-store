import { CreateConfig } from "@/types/config";
import { z } from "@medusajs/framework/zod";
import { Button, FocusModal, Heading, Hint, ProgressTabs } from "@medusajs/ui";
import { getZodShape, SnowForm } from "@snowpact/react-rhf-zod-form";
import React, { useMemo } from "react";
import { useCreateMutation } from "../hooks/use-create-mutation";
import { useWizardForm } from "../hooks/use-wizard-form";

interface CreateModalProps<S extends z.AnyZodObject> extends CreateConfig<S> {
  open?: boolean;
  name: string;
  onOpenChange?: (open: boolean) => void;
}

export default function CreateModal<S extends z.AnyZodObject>({
  name,
  steps = [],
  fields = {},
  schema,
  open,
  mutateFn,
  onOpenChange,
}: CreateModalProps<S>) {

  const mutate = useCreateMutation({
    invalidateKeys: [name],
    errorMessage: `Failed to create ${name}`,
    successMessage: `Successfully created ${name}`,
    createFn: mutateFn,
  });

  const [wizardState, action] = useWizardForm(steps, async (values) => {
    await mutate.mutateAsync(values);
    onOpenChange?.(false);
  });

  const activeSchema = useMemo(() => (steps.length > 0 ? wizardState.schema : schema) as S, [wizardState.schema, schema]) as S;

  if (!activeSchema) {
    throw new Error("Schema is required if no steps are provided");
  }

  const handleSubmit = async (values: z.infer<S>) => {
    if (steps.length > 0) {
      await action.handleSubmit(values);
    } else {
      await mutate.mutateAsync(values);
      onOpenChange?.(false);
    }
  }

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content>
        <SnowForm
          overrides={fields}
          schema={activeSchema}
          onSubmit={handleSubmit}
        >
          {({ renderField, renderSubmitButton, form }) => {
            if (steps.length > 0) {
              return (
                <ProgressTabs
                  value={wizardState.step}
                  className="flex flex-col h-full"
                  onValueChange={(tabId) =>
                    action.handleChange(tabId, form)
                  }
                >
                  <FocusModal.Header>
                    <ProgressTabs.List className="-my-2 w-full border-l">
                      {steps.map(({ id, label }) => (
                        <ProgressTabs.Trigger key={id} value={id}>
                          {label}
                        </ProgressTabs.Trigger>
                      ))}
                    </ProgressTabs.List>
                  </FocusModal.Header>

                  <FocusModal.Body className="relative flex-1">
                    {steps.map(({ id, label, description, header }) => {
                      if (wizardState.step !== id) {
                        return <React.Fragment key={id} />;
                      }
                      return (
                        <ProgressTabs.Content
                          key={id}
                          value={id}
                          className="h-full mx-auto max-w-lg flex flex-col py-16 px-4"
                        >
                          {(header === undefined || header === true) && (
                            <div className="flex flex-col">
                              <Heading level="h1" className="mb-2">
                                {label}
                              </Heading>
                              {description && <Hint>{description}</Hint>}
                            </div>
                          )}

                          {wizardState.fields.map((key) => renderField(key))}
                        </ProgressTabs.Content>
                      );
                    })}
                  </FocusModal.Body>
                  <FocusModal.Footer>
                    <div className="flex items-center justify-end gap-x-2">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => onOpenChange?.(false)}
                      >
                        Cancel
                      </Button>
                      {renderSubmitButton({
                        disabled: !form.formState.isValid && !wizardState.hasNext,
                        children: wizardState.hasNext ? "Next" : "Create",
                      })}
                    </div>
                  </FocusModal.Footer>
                </ProgressTabs>
              );
            }

            const fieldKeys = Object.keys(getZodShape(activeSchema)) as (keyof z.infer<S>)[];

            return <>
              <FocusModal.Header>
                <Heading level="h1">Create {name}</Heading>
              </FocusModal.Header>
              <FocusModal.Body className="mx-auto max-w-lg flex flex-col py-16 px-4">
                {fieldKeys.map((key) => renderField(key))}
              </FocusModal.Body>
              <FocusModal.Footer>
                <div className="flex items-center justify-end gap-x-2">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => onOpenChange?.(false)}
                  >
                    Cancel
                  </Button>
                  {renderSubmitButton({
                    disabled: !form.formState.isValid,
                    children: "Create",
                  })}
                </div>
              </FocusModal.Footer>
            </>
          }}
        </SnowForm>
      </FocusModal.Content>
    </FocusModal>
  );
}
