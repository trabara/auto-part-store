// Admin definition of the fitment module (`/app/fitments/...`). Isomorphic:
// no UI code here; the Conditions panel is given by the admin page
// (./sections.tsx).
import { defineModule } from "@repo/framework/core";
import { conditionAttributes } from "../conditions";
import { AutomotiveAttribute, Fitment, FitmentPosition } from "../entities";

// Features match the entities of the module's API (../http.ts).
export default defineModule({
  name: "Fitments",
  path: "fitments",
  features: (m) => ({
    fitment: m.crud(Fitment, {
      path: "fitments",
      // Shown by the Conditions section instead.
      overrides: { conditions_summary: { label: "Conditions", hideInDetails: true } },
      relations: {
        variant: { label: "Part" },
        conditionGroups: { hidden: true },
      },
      steps: [
        {
          id: "application",
          label: "Application",
          fields: ["variant_id", "vehicle_id", "position_id", "quantity"],
        },
        {
          id: "production",
          label: "Production window",
          description: "Leave empty when the part fits the vehicle's whole production range.",
          fields: ["from_year", "from_month", "to_year", "to_month", "notes"],
        },
      ],
    }),
    fitment_position: m.crud(FitmentPosition, { path: "positions" }),
    automotive_attribute: m.crud(AutomotiveAttribute, {
      path: "attributes",
      label: "Vehicle attributes",
      // The code comes from the injected catalog; its type is derived.
      overrides: {
        code: {
          type: "select",
          // A getter: the domain registers the catalog after this module loads.
          get options() {
            return conditionAttributes().map((a) => ({ value: a.code, label: `${a.label} (${a.code})` }));
          },
        },
      },
    }),
  }),
});
