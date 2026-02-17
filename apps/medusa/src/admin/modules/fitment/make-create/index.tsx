import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  FocusModal,
  Heading,
  Hint,
  Input,
  Label,
  toast,
} from "@medusajs/ui";
import { z } from "@medusajs/framework/zod";
import { sdk } from "~/admin/lib/sdk";

const CreateMakeSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type CreateMakeInput = z.infer<typeof CreateMakeSchema>;

const MakeCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<CreateMakeInput>({
    resolver: zodResolver(CreateMakeSchema),
    defaultValues: {
      name: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateMakeInput) =>
      sdk.client.fetch("/admin/makes", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      toast.success("Make created successfully");
      queryClient.invalidateQueries({ queryKey: ["makes"] });
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create make");
    },
  });

  const handleClose = () => {
    navigate(-1);
  };

  const handleSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data);
  });

  return (
    <FocusModal open onOpenChange={handleClose}>
      <FocusModal.Content>
        <form onSubmit={handleSubmit}>
          <FocusModal.Header>
            <div className="flex items-center justify-end gap-x-2">
              <Button variant="secondary" size="small" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="small"
                isLoading={createMutation.isPending}
              >
                Create
              </Button>
            </div>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-col items-center py-16">
            <div className="w-full max-w-lg space-y-8">
              <div className="flex flex-col items-center text-center">
                <Heading level="h1" className="mb-2">
                  Create Make
                </Heading>
                <p className="text-ui-fg-subtle text-sm">
                  Add a new vehicle make to your catalog
                </p>
              </div>

              <div className="space-y-4">
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="name" className="font-medium">
                        Make Name <span className="text-ui-fg-error">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="e.g., Toyota, Ford, Honda"
                        aria-invalid={!!fieldState.error}
                        autoFocus
                        {...field}
                      />
                      {fieldState.error && (
                        <Hint variant="error">{fieldState.error.message}</Hint>
                      )}
                      <Hint>
                        Enter the manufacturer or brand name (e.g., Toyota,
                        Ford)
                      </Hint>
                    </div>
                  )}
                />
              </div>
            </div>
          </FocusModal.Body>
        </form>
      </FocusModal.Content>
    </FocusModal>
  );
};

export default MakeCreate;
