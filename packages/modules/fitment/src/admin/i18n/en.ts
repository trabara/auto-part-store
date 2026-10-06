// English messages of the fitment module: the source every locale matches.
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
