import { EditConfig } from "@/types/config";
import { z } from "@medusajs/framework/zod";
import { Button, Drawer, Heading, Hint } from "@medusajs/ui";
import { SnowForm } from "@snowpact/react-rhf-zod-form";
import { useUpdateMutation } from "../hooks/use-update-mutation";


interface EditDrawerProps<S extends z.AnyZodObject> extends EditConfig<z.infer<S>> {
  name: string;
  open?: boolean;
  defaultValues?: z.infer<S>;
  mutateFn: (id: string, data: z.infer<S>) => Promise<void>;
  onOpenChange?: (open: boolean) => void;
}

const EditDrawer = <S extends z.AnyZodObject>({
  name,
  open,
  schema,
  fields = {},
  defaultValues,
  mutateFn,
  onOpenChange,
}: EditDrawerProps<S>) => {

  const mutate = useUpdateMutation({
    invalidateKeys: [name],
    errorMessage: `Failed to update ${name}`,
    successMessage: `Successfully updated ${name}`,
    updateFn: (data) => mutateFn(defaultValues?.id, data)
  })

  const handleSubmit = async (values: z.infer<S>) => {
    await mutate.mutateAsync(values);
    onOpenChange?.(false);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content>
        <SnowForm
          defaultValues={defaultValues}
          schema={schema as any}
          overrides={fields}
          onSubmit={handleSubmit}
          className="flex flex-col h-full"
        >
          {({ renderField, renderSubmitButton }, fieldKeys) => {
            return <>
              <Drawer.Header>
                <Heading level="h2">

                </Heading>
                <Hint className="text-ui-fg-subtle text-sm mt-1">

                </Hint>
              </Drawer.Header>
              <Drawer.Body className="flex flex-col gap-y-4">
                {fieldKeys.map((key) => renderField(key))}
              </Drawer.Body>
              <Drawer.Footer>
                <Button
                  variant="secondary"
                  onClick={() => onOpenChange?.(false)}
                  type="button"
                >
                  Cancel
                </Button>
                {renderSubmitButton({ children: <>Save <span className="capitalize">{name}</span></> })}
              </Drawer.Footer>
            </>
          }}
        </SnowForm>
      </Drawer.Content>
    </Drawer>
  );
};

export default EditDrawer;
