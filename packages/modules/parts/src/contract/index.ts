// Contract of the parts module (`@repo/module-parts/contract`): what it
// promises to the outside, isomorphic and stable. The only entry other
// modules may import.
export * from "./manifest";
export * from "./entities";
export { default as partsTranslations, type PartsMessages } from "./i18n";
