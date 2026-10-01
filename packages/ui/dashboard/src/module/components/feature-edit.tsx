import { Button, Drawer, Heading, Hint } from "@medusajs/ui";
import _ from "lodash";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSdk } from "../../common/context";
import { Form } from "../../form/components/form";
import { useModule } from "../context/module";
import { useUpdateMutation } from "../hooks/use-update-mutation";
import { PageConfig } from "../types";

const UpdateFeature = ({
  entity,
  config,
}: {
  entity: string;
  config: PageConfig;
}) => {
  const module = useModule<{ id?: string }>();

  const sdk = useSdk();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const name = _.startCase(entity);

  const dispose = () => {
    if (module.state?.id) {
      navigate(`${module.path}/${entity}/${module.state.id}`);
    } else {
      navigate(`${module.path}/${entity}`);
    }
  };

  const updateAction = (data: any): Promise<void> =>
    sdk.client.fetch(`/admin${module.path}/${entity}/${data.id}`, {
      method: "PUT",
      body: data,
    });

  const mutation = useUpdateMutation({
    invalidateKeys: [module.path, entity],
    errorMessage: `Failed to update ${name}`,
    successMessage: `Successfully updated ${name}`,
    updateFn: (data) => updateAction(data),
    onSuccess: () => dispose(),
  });

  const handleSubmit = async (values: any) => {
    await mutation.mutateAsync(values);
    dispose();
  };

  const overrideFields = useMemo(() => {
    const fields =
      typeof config.fields === "function" ? config.fields(t) : config.fields;

    return {
      ...module.buildRelationFields(entity, config.schema),
      ...fields,
    };
  }, [config, t, module, entity]);

  return (
    <Drawer open={true} onOpenChange={() => dispose()}>
      <Drawer.Content>
        <Form
          schema={config.schema as any}
          defaultValues={module.state}
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

export default UpdateFeature;
