import { LayoutComposer } from "@medusajs/dashboard/components";
import { Pencil, Trash } from "@medusajs/icons";
import _ from "lodash";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { classifyValue, DetailsSection } from "../components/details-section";
import { ManyRelationSection } from "../components/many-relation-section";
import { useModule } from "../context/module";
import { useDeleteMutation } from "../hooks/use-delete-mutation";
import { FeaturePageConfig } from "../types";
import { useSdk } from "../../common/context";

type DetailsPageProps = {
  config: FeaturePageConfig;
  entity: string;
  initialData?: any;
  children?: React.ReactNode;
};

const MedusaDetailsPage = ({
  initialData,
  entity,
  config,
  children,
}: DetailsPageProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const sdk = useSdk();

  const module = useModule();

  const title = config.getTitle(initialData);

  // Group the entity's own fields by data relationship: many -> a data
  // table for the main column, one -> a details block for the side
  // column, and plain scalar attributes -> the entity's own "General"
  // details block, also in the side column. Runs unconditionally (before
  // the early returns below) to respect the Rules of Hooks; `data` may
  // still be undefined here while the query is loading.
  const attributes = useMemo(() => {
    const scalar: [string, unknown][] = [];
    const many: [string, Record<string, any>[]][] = [];
    const one: [string, Record<string, any>][] = [];

    Object.entries(initialData ?? {}).forEach(([key, value]) => {
      switch (classifyValue(value)) {
        case "many":
          many.push([key, value as Record<string, any>[]]);
          break;
        case "one":
          one.push([key, value as Record<string, any>]);
          break;
        default:
          scalar.push([key, value]);
      }
    });

    return { scalar, many, one };
  }, [initialData]);

  const deleteMutation = useDeleteMutation({
    invalidateKeys: [module.path],
    errorMessage: t("common.error_delete_item"),
    successMessage: t("common.success_delete_item"),
    deleteFn: async (id: string) => {
      await sdk.client.fetch(`/admin${module.path}/${id}`, {
        method: "DELETE",
      });
      navigate(module.path);
    },
  });

  const mainSections = useMemo(
    () => [
      <DetailsSection
        key="__general"
        title={title}
        attributes={attributes.scalar}
        actions={[
          {
            id: "edit",
            label: "Modifé",
            icon: <Pencil />,
            onClick: () => navigate(`${module.path}/${initialData.id}/edit`),
          },
          {
            id: "delete",
            label: "Supprimer",
            icon: <Trash />,
            onClick: () => deleteMutation.mutateAsync(initialData.id),
          },
        ]}
      />,
      ...attributes.many.map(([key, rows]) => (
        <ManyRelationSection key={key} title={_.startCase(key)} rows={rows} />
      )),
    ],
    [attributes.many, attributes.scalar, title],
  );

  const sideSections = useMemo(
    () => [
      ...attributes.one.map(([key, relation]) => (
        <DetailsSection
          key={key}
          title={_.startCase(key)}
          attributes={Object.entries(relation ?? {})}
        />
      )),
    ],
    [attributes.one],
  );

  const preferredLayoutId = () => {
    if (mainSections.length > 0 && sideSections.length > 0) {
      return "core:two-column";
    }
    return "core:single-column";
  };

  return (
    <>
      <LayoutComposer
        data={initialData}
        widgetsZonePrefix={`${entity}.details`}
        preferredLayoutId={preferredLayoutId()}
        sections={{
          main: mainSections,
          side: sideSections,
        }}
      />
      {children}
    </>
  );
};

export default MedusaDetailsPage;
