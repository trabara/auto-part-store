import { StepConfig } from "@/types/config";
import { z } from "@medusajs/framework/zod";
import { Button, FocusModal, Heading, Hint, ProgressTabs } from "@medusajs/ui";
import { getZodShape, SnowForm } from "@snowpact/react-rhf-zod-form";
import React, { useCallback, useMemo, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useCreateMutation } from "../hooks/use-create-mutation";

interface CreateModalProps<TSchema extends z.AnyZodObject> {
  open?: boolean;
  name: string;
  steps: StepConfig<TSchema>[];
  fields?: Record<string, any>;
  onOpenChange?: (open: boolean) => void;
  fetcher: (data: any) => Promise<any>;
}

export default function CreateModal<TSchema extends z.AnyZodObject>({
  name,
  steps = [],
  fields = {},
  fetcher,
  open,
  onOpenChange,
}: CreateModalProps<TSchema>) {
  const [activeStep, setActiveStep] = useState(() => steps[0]?.id);
  const [allValues, setAllValues] = useState<Record<string, unknown>>({});

  const currentStep = useMemo(() => {
    return steps.find((tab) => tab.id === activeStep) || steps[0];
  }, [steps, activeStep]);

  const hasNextStep = useMemo(() => {
    const currentIndex = steps.findIndex((tab) => tab.id === activeStep);
    return currentIndex < steps.length - 1;
  }, [steps, activeStep]);

  const prevStep = useMemo(() => {
    const currentIndex = steps.findIndex((tab) => tab.id === activeStep);
    if (currentIndex > 0) {
      return steps[currentIndex - 1];
    }
    return null;
  }, [steps, activeStep]);

  const nextStep = useMemo(() => {
    const currentIndex = steps.findIndex((tab) => tab.id === activeStep);
    if (currentIndex < steps.length - 1) {
      return steps[currentIndex + 1];
    }
    return null;
  }, [steps, activeStep]);

  const handleTabChange = useCallback(
    (tabId: string, form: UseFormReturn<any>) => {
      const isGoingBack = prevStep && prevStep.id === tabId;
      const values = form.getValues();
      // Always save current step values before switching
      setAllValues((prev) => ({ ...prev, ...values }));

      if (isGoingBack) {
        setActiveStep(tabId);
        return;
      }
      const parseResult = currentStep?.schema?.safeParse(values)
      const isValid =
        parseResult?.success ?? true;

      if (!isValid) {
        parseResult?.error?.errors.forEach((err) => {
          form.setError(err.path.join("."), {
            type: "manual",
            message: err.message,
          });
        });
        return;
      }
      setActiveStep(tabId);
    },
    [currentStep, prevStep, allValues],
  );

  const mutate = useCreateMutation({
    invalidateKeys: [name],
    errorMessage: `Failed to create ${name}`,
    successMessage: `Successfully created ${name}`,
    createFn: fetcher,
  });

  const mergedSchema = useMemo(() => {
    return steps.reduce(
      (acc, step) => acc.merge(step.schema),
      z.object({}),
    ) as z.AnyZodObject;
  }, [steps]);

  const handleSubmit = useCallback(
    async (values: any) => {
      const schema = currentStep?.schema || mergedSchema;
      const valid = schema.safeParse(values);

      // Merge current step's validated values (includes Zod defaults/transforms)
      const currentValues = valid.success ? valid.data : values;
      const updatedAllValues = { ...allValues, ...currentValues };

      if (hasNextStep && valid.success) {
        setAllValues(updatedAllValues);
        setActiveStep(nextStep!.id);
        return;
      }

      if (!valid.success) {
        return;
      }

      if (!hasNextStep && valid.success) {
        // Final submit: validate all accumulated values against merged schema
        const finalValid = mergedSchema.safeParse(updatedAllValues);

        if (!finalValid.success) {
          setAllValues(updatedAllValues);
          return;
        }

        await mutate.mutateAsync(finalValid.data);
        onOpenChange?.(false);
      }
    },
    [
      currentStep,
      hasNextStep,
      nextStep,
      mutate,
      mergedSchema,
      allValues,
      onOpenChange,
    ],
  );

  const currentStepSchema = useMemo(() => {
    return steps.find((step) => step.id === activeStep)?.schema || mergedSchema;
  }, [steps, activeStep, mergedSchema]);

  const currentStepFields = useMemo(() => {
    return Object.keys(getZodShape(currentStepSchema));
  }, [currentStepSchema]);

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content>
        <SnowForm
          overrides={fields}
          schema={currentStepSchema}
          onSubmit={handleSubmit}
        >
          {({ renderField, renderSubmitButton, form }) => {
            return (
              <ProgressTabs
                value={activeStep}
                onValueChange={(tabId) =>
                  handleTabChange(tabId, form)
                }
                className="flex flex-col h-full"
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
                    if (currentStep?.id !== id) {
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

                        {currentStepFields.map((key) => renderField(key))}
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
                      children: hasNextStep ? "Next" : "Create",
                    })}
                  </div>
                </FocusModal.Footer>
              </ProgressTabs>
            );
          }}
        </SnowForm>
      </FocusModal.Content>
    </FocusModal>
  );
}
