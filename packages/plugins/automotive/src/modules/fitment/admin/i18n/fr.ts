import type { SameShape } from "@repo/framework/core";
import type { en } from "./en";

export const fr: SameShape<typeof en> = {
  name: "Compatibilités",
  features: {
    fitment: "Compatibilités",
    fitment_position: "Positions",
    automotive_attribute: "Attributs véhicule",
  },
  steps: {
    fitment: { application: "Application", production: "Période de production" },
  },
  entities: {
    Fitment: {
      name: "Compatibilité",
      plural: "Compatibilités",
      fields: {
        variant: "Pièce",
        vehicle: "Véhicule",
        position: "Position",
        quantity: "Quantité",
        from_year: "Année de début",
        from_month: "Mois de début",
        to_year: "Année de fin",
        to_month: "Mois de fin",
        notes: "Remarques",
        conditions_summary: "Conditions",
      },
    },
    FitmentPosition: {
      name: "Position",
      plural: "Positions",
      fields: { code: "Code", name: "Nom", category: "Catégorie", fitments: "Compatibilités" },
    },
    AutomotiveAttribute: {
      name: "Attribut véhicule",
      plural: "Attributs véhicule",
      fields: { code: "Champ du véhicule", name: "Nom", data_type: "Type", default_unit: "Unité", category: "Catégorie" },
      values: {
        data_type: {
          string: "Texte",
          number: "Nombre",
          boolean: "Oui / non",
          date: "Date",
          enum: "Liste de valeurs",
          array: "Liste",
          object: "Objet",
        },
      },
    },
  },
};
