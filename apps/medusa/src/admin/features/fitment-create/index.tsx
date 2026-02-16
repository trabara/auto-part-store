import {
  Button,
  FocusModal,
  ProgressTabs,
  toast,
  usePrompt,
} from "@medusajs/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { sdk } from "~/lib/sdk";
import {
  CreateFitmentInput,
  CreateFitmentSchema,
} from "../../../modules/fitment/schema";
import TABS, { Tabs } from "./tabs";

export const DEFAULT_FORM_VALUES: CreateFitmentInput = {
  model: { name: "", make: { name: "" } },
  engine: { fuel: "GASOLINE", size: "1.0", tech: undefined, type: "I4" },
  body_style: "SEDAN",
  drive: "FWD",
  doors: 4,
  transmission: "MANUAL",
  year_start: 2020,
  year_end: 2023,
};

const CreateFitmentModal = ({ productId }: { productId?: string }) => {
  const cancelPrompt = usePrompt();
  const navigate = useNavigate();

  const handleCancel = async () => {
    const confirmed = await cancelPrompt({
      title: "Are you sure you want to leave this form?",
      description:
        "You have unsaved changes that will be lost if you exit this form.",
      confirmText: "Continue",
      variant: "confirmation",
    });
    if (confirmed) {
      navigate(-1);
    }
  };

  const form = useForm<CreateFitmentInput>({
    defaultValues: { ...DEFAULT_FORM_VALUES, product_id: productId },
  });

  const steps = Object.keys(TABS) as Tabs[];
  const [active, setActive] = useState<Tabs>("general");

  const validateTab = (value: Tabs) => {
    const step = TABS[value];
    try {
      const result = step.validate(form.getValues());
      // Clear error if validation passes
      form.clearErrors(step.accessor as any);
      return result;
    } catch (e) {
      form.setError(step.accessor as any, { message: step.error });
      return false;
    }
  };
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreateFitmentInput) =>
      sdk.client.fetch("/admin/fitments", {
        method: "POST",
        body: CreateFitmentSchema.parse(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["fitments"]] });
      navigate(-1);
    },
    onError: () => {
      toast.error(
        "An error occurred while submitting the form. Please try again.",
      );
    },
  });

  const currentStepIndex = steps.indexOf(active);
  const onSubmit = (data: CreateFitmentInput) => {
    const step = steps[currentStepIndex];
    const isValid = validateTab(step);

    if (isValid && currentStepIndex < steps.length - 1) {
      setActive(steps[currentStepIndex + 1]);
    } else {
      mutation.mutate(data);
    }
  };

  const handleTabsChange = useCallback(
    (value: string) => {
      const stepIndex = steps.indexOf(value as Tabs);
      const prevStep = stepIndex > 0 ? steps[stepIndex - 1] : steps[0];

      // Clear all errors before validating
      form.clearErrors();

      if (validateTab(prevStep)) {
        setActive(value as Tabs);
      }
    },
    [active, validateTab],
  );

  const TabContent = useMemo(() => {
    const step = TABS[active];
    return () => (
      <ProgressTabs.Content value={active}>
        <step.Component />
      </ProgressTabs.Content>
    );
  }, [active]);

  return (
    <FormProvider {...form}>
      <FocusModal open onOpenChange={handleCancel}>
        <FocusModal.Content asChild>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ProgressTabs
              value={active}
              onValueChange={handleTabsChange}
              className="flex h-full flex-col overflow-hidden"
            >
              <FocusModal.Header>
                <div className="flex w-full items-center justify-between gap-x-4">
                  <div className="-my-2 w-full max-w-[600px] border-l">
                    <ProgressTabs.List>
                      {Object.keys(TABS).map((step) => (
                        <ProgressTabs.Trigger key={step} value={step}>
                          {TABS[step as Tabs].label}
                        </ProgressTabs.Trigger>
                      ))}
                    </ProgressTabs.List>
                  </div>
                </div>
              </FocusModal.Header>
              <FocusModal.Body>
                <div className="flex flex-1 flex-col items-center overflow-y-auto">
                  <div className="flex w-full max-w-[720px] flex-col gap-y-8 px-8 py-16">
                    <TabContent />
                  </div>
                </div>
              </FocusModal.Body>
            </ProgressTabs>
            <div className="border-ui-border-base flex items-center justify-end gap-x-2 border-t p-4">
              <div className="flex items-center justify-end gap-x-2">
                <Button variant="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button>Continue</Button>
              </div>
            </div>
          </form>
        </FocusModal.Content>
      </FocusModal>
    </FormProvider>
  );
};

export default CreateFitmentModal;
