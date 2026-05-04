import { z } from "@medusajs/framework/zod";
import { useCallback, useMemo, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { StepConfig } from "../types/config";
import { getZodShape } from "../utils";

type UseWizardFormReturn<S extends z.ZodObject> = [
  {
    fields: string[];
    hasNext: boolean;
    schema: z.ZodObject;
    step?: string;
  },
  {
    handleChange: (tabId: string, form: UseFormReturn<z.infer<S>>) => void;
    handleSubmit: (values: z.infer<S>) => Promise<void>;
  },
];
export const useWizardForm = <S extends z.ZodObject>(
  steps: StepConfig<S>[] = [],
  onSuccess: (values: z.infer<S>) => void,
): UseWizardFormReturn<S> => {
  const [activeStep, setActiveStep] = useState(() => steps[0]?.id);
  const [allValues, setAllValues] = useState<Record<string, unknown>>({});

  const currentStep = useMemo(() => {
    return steps.find((tab) => tab.id === activeStep) || steps[0]!;
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

  const mergedSchema = useMemo(() => {
    return steps.reduce(
      (acc, step) => acc.merge(step.schema),
      z.object({}),
    ) as S;
  }, [steps]);

  const currentStepSchema = useMemo(() => {
    return steps.find((step) => step.id === activeStep)?.schema || mergedSchema;
  }, [steps, activeStep, mergedSchema]);

  const currentStepFields = useMemo(() => {
    return Object.keys(getZodShape(currentStepSchema));
  }, [currentStepSchema]);

  const handleChange = useCallback(
    (tabId: string, form: UseFormReturn<z.infer<S>>) => {
      const isGoingBack = prevStep && prevStep.id === tabId;
      const values = form.getValues();
      // Always save current step values before switching
      setAllValues((prev) => ({ ...prev, ...values }));

      if (isGoingBack) {
        setActiveStep(tabId);
        return;
      }
      const parseResult = currentStep?.schema?.safeParse(values);
      const isValid = parseResult?.success ?? true;

      if (!isValid && parseResult?.error) {
        // In Zod v4, ZodError uses .issues instead of .errors
        parseResult.error.issues.forEach((err: any) => {
          // @ts-ignore
          form.setError(`${err.path.join(".")}`, {
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

  const handleSubmit = useCallback(
    async (values: z.infer<S>) => {
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

        onSuccess(finalValid.data);
      }
    },
    [currentStep, hasNextStep, nextStep, mergedSchema, allValues],
  );

  return [
    {
      fields: currentStepFields,
      hasNext: hasNextStep,
      schema: currentStepSchema,
      step: activeStep,
    },
    {
      handleChange,
      handleSubmit,
    },
  ];
};
