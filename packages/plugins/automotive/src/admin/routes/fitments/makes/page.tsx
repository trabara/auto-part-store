import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useTranslation } from "react-i18next";

export default function MakesPage() {
  const { t } = useTranslation();

  // const BASE_FIELDS: MedusaFieldOverrides<z.infer<typeof MakeSchema>> = {
  //   name: {
  //     label: t("make.field.name"),
  //     description: t("make.field.name.description"),
  //     isFiltrable: true,
  //   },
  // };

  return <></>;
}

export const handle = {
  breadcrumb: () => "Makes",
};

export const config = defineRouteConfig({
  label: "nav.makes",
  translationNs: "translation",
});
