// Contract of the vehicle module (`@repo/module-vehicle/contract`): what it
// promises to the outside, isomorphic and stable. The only entry other
// modules may import.
export * from "./manifest";
export * from "./entities";
export * from "./catalog";
export { default as vehicleTranslations, type VehicleMessages } from "./i18n";
