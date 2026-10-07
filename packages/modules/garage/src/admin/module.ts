import { defineModule } from "@repo/framework/core";
import { CustomerVehicle } from "../contract";

// Admin definition of the garage module (`/app/garage/...`). Isomorphic: no UI code.
// Features match the entities of the module's API (../server/http.ts).
export default defineModule({
  name: "Garage",
  path: "garage",
  features: (m) => ({
    customer_vehicle: m.crud(CustomerVehicle, { path: "vehicles", label: "Garage" }),
  }),
});
