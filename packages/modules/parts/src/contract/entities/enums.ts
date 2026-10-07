// Parts enums.
export enum BrandKind {
  /** Sold in the shop: has a value in the shared "Brand" product option. */
  AFTERMARKET = "AFTERMARKET",
  /** Issues OE numbers (vehicle manufacturers, OE suppliers); not sold as a brand. */
  OE = "OE",
  BOTH = "BOTH",
}

export enum PartNumberType {
  /** The brand's own number for this variant. */
  MPN = "MPN",
  /** Original-equipment number (brand = the OE issuer). */
  OE = "OE",
  /** A competitor's number for the same part. */
  AFTERMARKET = "AFTERMARKET",
  /** A former number of this part (superseded). */
  PREVIOUS = "PREVIOUS",
}
