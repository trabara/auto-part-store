// Contract of the garage module (`@repo/module-garage/contract`): what it promises
// to the outside, isomorphic and stable. The only entry other modules may import.
export * from "./manifest";
export * from "./entities";
export { default as garageTranslations, type GarageMessages } from "./i18n";
