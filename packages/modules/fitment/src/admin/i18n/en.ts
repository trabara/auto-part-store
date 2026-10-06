// English messages of the fitment module: the source every locale matches.
import { CONDITION_MESSAGES, OPERATOR_LABELS } from "../../conditions";

export const en = {
  name: "Fitments",
  features: {
    fitment: "Fitments",
    fitment_position: "Positions",
    automotive_attribute: "Vehicle attributes",
  },
  steps: {
    fitment: { application: "Application", production: "Production window" },
  },
  messages: {
    conditions: {
      // The English source of operator words and validation messages.
      operators: OPERATOR_LABELS,
      validation: CONDITION_MESSAGES,
      editor: {
        fitsWhen: "Fits when",
        all: "all",
        any: "any",
        ofTheseMatch: "of these match:",
        condition: "Condition",
        group: "Group",
        removeCondition: "Remove condition",
        removeGroup: "Remove group",
        from: "from",
        to: "to",
        value: "value",
        listPlaceholder: "Comma-separated, e.g. GTI, R-Line",
      },
      drawer: {
        title: "Fitment conditions",
        description: "Narrow which configurations of the vehicle this part fits (e.g. front-wheel drive only).",
        none: "No conditions: the part fits every configuration of the vehicle.",
        addFirst: "Add a condition",
        summary: "Summary",
        noConditions: "No conditions",
        removeAll: "Remove all",
        saved: "Conditions saved",
        removed: "Conditions removed",
        saveFailed: "Failed to save conditions",
      },
      section: { title: "Conditions", none: "None: fits every configuration of the vehicle." },
    },
  },
  entities: {
    Fitment: {
      name: "Fitment",
      plural: "Fitments",
      fields: {
        variant: "Part",
        vehicle: "Vehicle",
        position: "Position",
        quantity: "Quantity",
        from_year: "From year",
        from_month: "From month",
        to_year: "To year",
        to_month: "To month",
        notes: "Notes",
        conditions_summary: "Conditions",
      },
    },
    FitmentPosition: {
      name: "Position",
      plural: "Positions",
      fields: { code: "Code", name: "Name", category: "Category", fitments: "Fitments" },
    },
    AutomotiveAttribute: {
      name: "Vehicle attribute",
      plural: "Vehicle attributes",
      fields: { code: "Vehicle field", name: "Name", data_type: "Type", default_unit: "Unit", category: "Category" },
      values: {
        data_type: {
          string: "Text",
          number: "Number",
          boolean: "Yes / no",
          date: "Date",
          enum: "List of values",
          array: "List",
          object: "Object",
        },
      },
    },
  },
};
