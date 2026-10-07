import type { SameShape } from "@repo/framework/core";
import type { en } from "./en";

export const fr: SameShape<typeof en> = {
  name: "Garage",
  features: { customer_vehicle: "Garage" },
  steps: {},
  messages: {},
  entities: {
    CustomerVehicle: {
      name: "Véhicule du garage",
      plural: "Garage",
      fields: {
        customer: "Client",
        vehicle: "Véhicule",
        nickname: "Surnom",
        vin: "VIN",
        registration: "Immatriculation",
        is_default: "Véhicule par défaut",
        build_year: "Année de fabrication",
        build_month: "Mois de fabrication",
      },
    },
  },
};
