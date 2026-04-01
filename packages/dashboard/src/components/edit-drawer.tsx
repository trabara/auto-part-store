import { EditConfig } from "@/types/config";
import { z } from "@medusajs/framework/zod";
import { PencilSquare } from "@medusajs/icons";
import { Button, Drawer, Heading, Hint } from "@medusajs/ui";
import { SnowForm } from "@snowpact/react-rhf-zod-form";
import { forwardRef, memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUpdateMutation } from "../hooks/use-update-mutation";


interface EditDrawerProps<S extends z.AnyZodObject> extends EditConfig<z.infer<S>> {
  open?: boolean;
  defaultValues?: z.infer<S>;
  mutateFn: (id: string, data: z.infer<S>) => Promise<void>;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

const EditDrawer = forwardRef(<S extends z.AnyZodObject>(props: EditDrawerProps<S>, ref: React.Ref<HTMLButtonElement>) => {
  const { id, open, schema, fields = {}, defaultValues, mutateFn } = props;
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const mutate = useUpdateMutation({
    invalidateKeys: [id],
    errorMessage: `Failed to update ${id}`,
    successMessage: `Successfully updated ${id}`,
    updateFn: (data) => mutateFn(defaultValues?.id, data),
    onSuccess: () => {
      setIsDrawerOpen(false);
    }
  })

  const handleSubmit = async (values: z.infer<S>) => {
    await mutate.mutateAsync(values);
    setIsDrawerOpen(false);
  }

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <Drawer.Trigger asChild ref={ref}>
        <Button onClick={() => setIsDrawerOpen(true)} variant="transparent" size="small" className="w-full justify-start px-2 py-1.5 [&_svg]:text-ui-fg-subtle flex items-center gap-x-2">
          <PencilSquare />
          <span>{t('common.edit')}</span>
        </Button>
      </Drawer.Trigger>
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
                  Edit <span className="capitalize">{id}</span>
                </Heading>
                <Hint className="text-ui-fg-subtle text-sm mt-1">

                </Hint>
              </Drawer.Header>
              <Drawer.Body className="flex flex-col gap-y-4">
                {fieldKeys.map((key) => renderField(key))}
              </Drawer.Body>
              <Drawer.Footer>
                <Drawer.Close asChild>
                  <Button
                    variant="secondary"
                    size="small"
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    Cancel
                  </Button>
                </Drawer.Close>
                {renderSubmitButton({ children: <>Save <span className="capitalize">{id}</span></> })}
              </Drawer.Footer>
            </>
          }}
        </SnowForm>
      </Drawer.Content>
    </Drawer>
  );
})

export default memo(EditDrawer);
