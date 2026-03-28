import { EditConfig } from "@/types/config";
import { z } from "@medusajs/framework/zod";
import { Button, Drawer, Heading, Hint } from "@medusajs/ui";
import { SnowForm } from "@snowpact/react-rhf-zod-form";
import { useUpdateMutation } from "../hooks/use-update-mutation";


interface EditDrawerProps<S extends z.AnyZodObject> extends EditConfig<S> {
  name: string;
  open?: boolean;
  defaultValues?: z.infer<S>;
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
    updateFn: mutateFn
  })

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content asChild>
        <SnowForm
          defaultValues={defaultValues}
          schema={schema}
          overrides={fields as {}}
          onSubmit={async (values) => {
            await mutate.mutateAsync(values);
          }}
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
