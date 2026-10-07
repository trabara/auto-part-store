import type { SameShape } from "@repo/framework/core";
import type { en } from "./en";

export const fr: SameShape<typeof en> = {
  name: "Pièces",
  features: { brand: "Marques", part_number: "Références" },
  steps: {
    part_number: { number: "Référence" },
  },
  entities: {
    Brand: {
      name: "Marque",
      plural: "Marques",
      fields: { name: "Nom", slug: "Slug", logo: "Logo", kind: "Type", partNumbers: "Références" },
      values: {
        kind: { AFTERMARKET: "Rechange", OE: "Première monte (OE)", BOTH: "OE et rechange" },
      },
    },
    PartNumber: {
      name: "Référence",
      plural: "Références",
      fields: { variant: "Pièce", brand: "Marque", type: "Type", number: "Numéro", number_normalized: "Clé de recherche" },
      values: {
        type: { MPN: "Référence fabricant", OE: "Référence OE", AFTERMARKET: "Référence concurrente", PREVIOUS: "Ancienne référence" },
      },
    },
  },
};
