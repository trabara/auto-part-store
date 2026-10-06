// Admin entry (`@repo/module-parts/admin`): the module's admin definition and
// its translations. No UI code: tests and the server load it too.
export { default as partsAdmin } from "./module";
export { default as partsTranslations, type PartsMessages } from "./i18n";
