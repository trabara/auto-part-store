// Detail-page panels of the fitment admin, given to `<Module sections>` by
// the admin page (UI code stays out of the module definition).
import type { DetailSectionDef } from "@repo/framework/core";
import { ConditionsSection } from "./conditions-drawer";

export const fitmentSections: Readonly<Record<string, readonly DetailSectionDef[]>> = {
  fitment: [{ id: "conditions", render: (ctx: any) => <ConditionsSection {...ctx} /> }],
};
