// English messages of the parts module: the source every locale matches.
export const en = {
  name: "Parts",
  features: { brand: "Brands", part_number: "Part numbers" },
  steps: {
    part_number: { number: "Number" },
  },
  entities: {
    Brand: {
      name: "Brand",
      plural: "Brands",
      fields: { name: "Name", slug: "Slug", logo: "Logo", kind: "Kind", partNumbers: "Part numbers" },
      values: {
        kind: { AFTERMARKET: "Aftermarket", OE: "Original equipment (OE)", BOTH: "OE and aftermarket" },
      },
    },
    PartNumber: {
      name: "Part number",
      plural: "Part numbers",
      fields: { variant: "Part", brand: "Brand", type: "Type", number: "Number", number_normalized: "Search key" },
      values: {
        type: { MPN: "Manufacturer number", OE: "OE number", AFTERMARKET: "Competitor number", PREVIOUS: "Former number" },
      },
    },
  },
};
