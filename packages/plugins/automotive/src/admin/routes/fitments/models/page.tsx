import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useTranslation } from "react-i18next";

export default function ModelsPage() {
  const { t } = useTranslation();

  // const LIST_FIELDS: MedusaFieldOverrides<ModelRow> = {
  //   name: {
  //     label: t("model.field.name"),
  //     description: t("model.field.name.description"),
  //     isFiltrable: true,
  //   },
  //   make: {
  //     label: t("model.field.make"),
  //     isFiltrable: false,
  //     cell: (info) => {
  //       const make = info.getValue() as ModelRow["make"];
  //       return <Badge>{make?.name ?? "—"}</Badge>;
  //     },
  //   },
  // };

  // const MUTATION_FIELDS: MedusaFieldOverrides<
  //   z.infer<typeof CreateModelInputSchema>
  // > = {
  //   name: {
  //     label: t("model.field.name"),
  //     description: t("model.field.name.description"),
  //   },
  //   make_id: {
  //     label: t("model.field.make"),
  //     description: t("model.field.make.description"),
  //     render: ({ value, onChange }) => (
  //       <MakeSelect
  //         defaultValue={value as string}
  //         onChange={onChange as (v: string) => void}
  //       />
  //     ),
  //   },
  // };

  return <></>;
}

export const handle = {
  breadcrumb: () => "Models",
};

export const config = defineRouteConfig({
  label: "nav.models",
  translationNs: "translation",
});
