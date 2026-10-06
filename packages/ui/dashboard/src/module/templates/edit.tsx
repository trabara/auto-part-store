import { z } from "@medusajs/framework/zod";
import { Button, Drawer, Heading } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import type { RouteRenderContext } from "@repo/framework/admin";
import { startCase } from "lodash";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useSdk } from "../../common/context";
import { Form } from "../../form/components/form";
import { useUpdateMutation } from "../hooks/use-update-mutation";
import { entityFields } from "../utils/query";
import { formOverrides, recordDefaults, stepOrdered } from "../utils/form-values";
import { entityUrl, featurePath, useFeature } from "../utils/routes";

/** Edit drawer for one record of a feature's entity (rendered in the detail outlet). */
export function TemplateEdit(_: RouteRenderContext) {
  const { module, feature, entity, route } = useFeature();
  const { id = "" } = useParams();
  const sdk = useSdk();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const schema = route.dto as z.ZodObject<any>;
  const name = startCase(entity.name);

  const { data } = useQuery({
    queryKey: [entity.modelName, id, "edit"],
    queryFn: ({ signal }) =>
      sdk.client
        .fetch<{ data: Record<string, unknown> }>(entityUrl(module, entity, id), {
          signal,
          query: { fields: entityFields(module, feature) },
        })
        .then((r) => r.data),
  });

  const overrides = useMemo(() => formOverrides(module, feature, schema), [module, feature, schema]);

  const close = () => navigate(featurePath(feature, "detail", { id })!, { replace: true });

  const update = useUpdateMutation({
    invalidateKeys: [entity.modelName],
    errorMessage: `Failed to update ${name}`,
    successMessage: `${name} updated`,
    updateFn: (body) => sdk.client.fetch(entityUrl(module, entity, id), { method: "PUT", body }),
    onSuccess: close,
  });

  return (
    <Drawer open onOpenChange={close}>
      <Drawer.Content>
        {!data && (
          <Drawer.Title className="sr-only">
            {t("common.edit", "Edit")} {name}
          </Drawer.Title>
        )}
        {data && (
          <Form
            schema={schema as any}
            defaultValues={recordDefaults(module, feature, schema, data) as any}
            overrides={overrides}
            onSubmit={(values) => update.mutateAsync(values)}
            className="flex h-full flex-col"
          >
            {({ renderField, renderSubmitButton }, fieldKeys) => (
              <>
                <Drawer.Header>
                  <Drawer.Title asChild>
                    <Heading level="h2">
                      {t("common.edit", "Edit")} {name}
                    </Heading>
                  </Drawer.Title>
                </Drawer.Header>
                <Drawer.Body className="flex flex-col gap-y-4 overflow-y-auto">
                  {stepOrdered(feature, fieldKeys as string[]).map((key) => renderField(key as any))}
                </Drawer.Body>
                <Drawer.Footer>
                  <Button variant="secondary" size="small" type="button" onClick={close}>
                    {t("common.cancel", "Cancel")}
                  </Button>
                  {renderSubmitButton({ children: t("common.save", "Save") })}
                </Drawer.Footer>
              </>
            )}
          </Form>
        )}
      </Drawer.Content>
    </Drawer>
  );
}
