import { Button, Drawer, Heading, Hint } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Form } from "../components/form";
import { useUpdateMutation } from "../hooks/use-update-mutation";
import { useSdk } from "../provider/sdk-provider";
import { useMedusaCrud } from "../context/crud";

const MedusaEditPage = <T extends { id: string }>() => {
  const sdk = useSdk();
  const { config, data } = useMedusaCrud<T>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const dispose = () => {
    if (data?.id) {
      navigate(`${config.path}/${data.id}`);
    } else {
      navigate(`${config.path}`);
    }
  };

  const updateAction = (data: T): Promise<void> =>
    sdk.client.fetch(`/admin${config.path}/${data.id}`, {
      method: "PUT",
      body: data,
    });

  const mutation = useUpdateMutation({
    invalidateKeys: [config.path],
    errorMessage: `Failed to update ${config.name}`,
    successMessage: `Successfully updated ${config.name}`,
    updateFn: (data) => updateAction(data),
    onSuccess: () => dispose(),
  });

  const handleSubmit = async (values: T) => {
    await mutation.mutateAsync(values);
    dispose();
  };

  return (
    <Drawer open={true} onOpenChange={() => dispose()}>
      <Drawer.Content>
        <Form
          defaultValues={data}
          schema={config.editSchema}
          overrides={config.editFields}
          onSubmit={handleSubmit}
          className="flex flex-col h-full"
        >
          {({ renderField, renderSubmitButton }, fieldKeys) => {
            return (
              <>
                <Drawer.Header>
                  <Heading level="h2">
                    {t("common.edit")}{" "}
                    <span className="capitalize">{config.name}</span>
                  </Heading>
                  <Hint className="text-ui-fg-subtle text-sm mt-1"></Hint>
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
                      onClick={() => dispose()}
                    >
                      {t("common.cancel")}
                    </Button>
                  </Drawer.Close>
                  {renderSubmitButton({
                    children: (
                      <>
                        {t("common.save")}{" "}
                        <span className="capitalize">{config.name}</span>
                      </>
                    ),
                  })}
                </Drawer.Footer>
              </>
            );
          }}
        </Form>
      </Drawer.Content>
    </Drawer>
  );
};

export default MedusaEditPage;
