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
  messages: {
    conditions: {
      operators: {
        eq: "est", neq: "n'est pas", gt: "supérieur à", gte: "au moins", lt: "inférieur à", lte: "au plus",
        between: "entre", in: "parmi", not_in: "hors de",
      },
      validation: {
        and: "et",
        or: "ou",
        root: "Conditions",
        group: "groupe {{n}}",
        tooDeep: "{{max}} niveaux de groupes au maximum.",
        unknownAttribute: "« {{code}} » n'est pas un attribut connu.",
        badOperator: "{{attr}} : « {{op}} » n'est pas applicable.",
        needsValues: "{{attr}} : au moins une valeur est requise.",
        needsSingle: "{{attr}} : une seule valeur est attendue.",
        needsValue: "{{attr}} : valeur requise.",
        badValue: "{{attr}} : {{value}} n'est pas une valeur valide.",
        notNumber: "{{attr}} : un nombre est attendu.",
        needsUpper: "{{attr}} : borne supérieure requise.",
        upperBelow: "{{attr}} : la borne supérieure est inférieure à la borne inférieure.",
      },
      editor: {
        fitsWhen: "Compatible si",
        all: "toutes",
        any: "au moins une",
        ofTheseMatch: "des conditions suivantes :",
        condition: "Condition",
        group: "Groupe",
        removeCondition: "Retirer la condition",
        removeGroup: "Retirer le groupe",
        from: "de",
        to: "à",
        value: "valeur",
        listPlaceholder: "Séparées par des virgules, ex. GTI, R-Line",
      },
      drawer: {
        title: "Conditions de compatibilité",
        description: "Précisez les configurations du véhicule concernées (ex. traction avant uniquement).",
        none: "Aucune condition : la pièce convient à toutes les configurations du véhicule.",
        addFirst: "Ajouter une condition",
        summary: "Résumé",
        noConditions: "Aucune condition",
        removeAll: "Tout retirer",
        saved: "Conditions enregistrées",
        removed: "Conditions retirées",
        saveFailed: "Échec de l'enregistrement des conditions",
      },
      section: { title: "Conditions", none: "Aucune : convient à toutes les configurations du véhicule." },
    },
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
