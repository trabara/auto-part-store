import type { SameShape } from "@repo/framework/core";
import type { en } from "./en";

export const fr: SameShape<typeof en> = {
  messages: {
    attributes: {
      body_style: "Carrosserie",
      doors: "Portes",
      drive: "Transmission",
      transmission: "Boîte de vitesses",
      trim: "Finition",
      year_start: "Début de production",
      year_end: "Fin de production",
      engine: {
        code: "Code moteur",
        fuel: "Carburant",
        layout: "Architecture moteur",
        cylinders: "Cylindres",
        displacement_cc: "Cylindrée",
        power_kw: "Puissance",
        power_hp: "Puissance (ch)",
        name: "Technologie moteur",
      },
      generation: {
        name: "Génération",
        code: "Code génération",
        model: { name: "Modèle", category: "Catégorie de véhicule", make: { name: "Marque" } },
      },
    },
    attributeGroups: { vehicle: "Véhicule", engine: "Moteur", model: "Modèle" },
    widgets: {
      fitments: {
        title: "Véhicules compatibles",
        description: "Véhicules auxquels cette variante convient, par position.",
        production: "Production",
        editConditions: "Modifier les conditions",
      },
      garage: { title: "Garage", description: "Véhicules enregistrés par ce client.", yes: "Oui" },
      partNumbers: {
        title: "Références",
        description: "Référence fabricant, références OE, concurrentes et anciennes.",
        noBrand: "Sans marque",
      },
    },
  },
};
