import { defineModule } from "@repo/framework/core";
import { Brand, PartNumber } from "../contract";

// Admin definition of the parts module (`/app/parts/...`). Isomorphic: no UI code.
// Features match the entities of the module's API (../http.ts).
export default defineModule({
  name: "Parts",
  path: "parts",
  features: (m) => ({
    brand: m.crud(Brand, {
      relations: { partNumbers: { hidden: true } },
      // Managed by the parts module (shared "Brand" option value).
      overrides: { option_value_id: { hideLabel: true, isFiltrable: false } },
    }),
    part_number: m.crud(PartNumber, {
      label: "Part numbers",
      relations: { variant: { label: "Part" } },
      steps: [
        { id: "number", label: "Number", fields: ["variant_id", "type", "brand_id", "number"] },
      ],
    }),
  }),
});
