import { Button, Drawer, Heading, Hint } from "@medusajs/ui";
import _ from "lodash";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Form } from "../../form/components/form";
import { useUpdateMutation } from "../hooks/use-update-mutation";
import { FeaturePageConfig } from "../types";
import { useSdk } from "../../common/context";

const MedusaEditPage = ({
  entity,
  config,
  initialData,
}: {
  entity: string;
  config: FeaturePageConfig;
  initialData: any;
}) => {
  const sdk = useSdk();
  const { t } = useTranslation();

  const navigate = useNavigate();

  const name = _.startCase(entity);

  const dispose = () => {
    if (initialData?.id) {
      navigate(`${config.path}/${initialData.id}`);
    } else {
      navigate(`${config.path}`);
    }
  };

  const updateAction = (data: any): Promise<void> =>
    sdk.client.fetch(`/admin${config.path}/${data.id}`, {
      method: "PUT",
      body: data,
    });

  const mutation = useUpdateMutation({
    invalidateKeys: [config!.path!],
    errorMessage: `Failed to update ${name}`,
    successMessage: `Successfully updated ${name}`,
    updateFn: (data) => updateAction(data),
    onSuccess: () => dispose(),
  });

  const handleSubmit = async (values: any) => {
    await mutation.mutateAsync(values);
    dispose();
  };

  const overrideFields =
    typeof config.fields === "function" ? config.fields(t) : config.fields;

  return (
    <Drawer open={true} onOpenChange={() => dispose()}>
      <Drawer.Content>
        <Form
          defaultValues={initialData}
          schema={config.schema}
          overrides={overrideFields}
          onSubmit={handleSubmit}
          className="flex flex-col h-full"
        >
          {({ renderField, renderSubmitButton }, fieldKeys) => {
            return (
              <>
                <Drawer.Header>
                  <Heading level="h2">
                    {t("common.edit")}{" "}
                    <span className="capitalize">{name}</span>
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
                        <span className="capitalize">{name}</span>
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
