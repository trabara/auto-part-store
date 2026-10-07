// English messages of the automotive domain (its widgets and the vehicle
// fields fitment conditions test): the source every locale matches.
export const en = {
  messages: {
    attributes: {
      body_style: "Body style",
      doors: "Doors",
      drive: "Drive",
      transmission: "Transmission",
      trim: "Trim",
      year_start: "First production year",
      year_end: "Last production year",
      engine: {
        code: "Engine code",
        fuel: "Fuel",
        layout: "Engine layout",
        cylinders: "Cylinders",
        displacement_cc: "Displacement",
        power_kw: "Power",
        power_hp: "Power (hp)",
        name: "Engine technology",
      },
      generation: {
        name: "Generation",
        code: "Generation code",
        model: { name: "Model", category: "Vehicle category", make: { name: "Make" } },
      },
    },
    attributeGroups: { vehicle: "Vehicle", engine: "Engine", model: "Model" },
    widgets: {
      fitments: {
        title: "Fits vehicles",
        description: "Vehicles this variant fits, per position.",
        production: "Production",
        editConditions: "Edit conditions",
      },
      garage: { title: "Garage", description: "Vehicles this customer saved.", yes: "Yes" },
      partNumbers: {
        title: "Part numbers",
        description: "Its own number, OE references, competitor and former numbers.",
        noBrand: "No brand",
      },
    },
  },
};
