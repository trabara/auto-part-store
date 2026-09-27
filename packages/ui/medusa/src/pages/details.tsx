import { LayoutComposer } from "@medusajs/dashboard/components";
import _ from "lodash";
import { useEffect, useMemo } from "react";
import { classifyValue, DetailsSection } from "../components/details-section";
import { ManyRelationSection } from "../components/many-relation-section";
import { useMedusaCrud } from "../context/crud";

type DetailsPageProps = {
  id?: string;
  initialData?: any;
  children?: React.ReactNode;
};

const MedusaDetailsPage = ({ initialData, children }: DetailsPageProps) => {
  const { config, details, setDetails } = useMedusaCrud();

  const { getTitle } = config.details;

  const title = getTitle(initialData);

  // Group the entity's own fields by data relationship: many -> a data
  // table for the main column, one -> a details block for the side
  // column, and plain scalar attributes -> the entity's own "General"
  // details block, also in the side column. Runs unconditionally (before
  // the early returns below) to respect the Rules of Hooks; `data` may
  // still be undefined here while the query is loading.
  const entities = useMemo(() => {
    const scalar: [string, unknown][] = [];
    const many: [string, Record<string, any>[]][] = [];
    const one: [string, Record<string, any>][] = [];

    Object.entries(details ?? {}).forEach(([key, value]) => {
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
  }, [details]);

  useEffect(() => {
    setDetails(initialData);
  }, []);

  const mainSections = [
    <DetailsSection key="__general" title={title} entries={entities.scalar} />,
    ...entities.many.map(([key, rows]) => (
      <ManyRelationSection key={key} title={_.startCase(key)} rows={rows} />
    )),
  ];

  const sideSections = [
    ...entities.one.map(([key, relation]) => (
      <DetailsSection
        key={key}
        title={_.startCase(key)}
        entries={Object.entries(relation ?? {})}
      />
    )),
  ];

  return (
    <>
      <LayoutComposer
        data={details}
        widgetsZonePrefix={`${config.entity}.details`}
        preferredLayoutId="core:two-column"
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
