// Import Medusa keys
import type { Resources } from "@medusajs/dashboard";
// Import your custom translation keys
// For example, import the English translation file
import type enTranslation from "./i18n/en.json";
// add other imports for different languages if needed...
// import type esTranslation from "./i18n/es.json"

declare module "i18next" {
  interface CustomTypeOptions {
    fallbackNS: "translation";
    resources: {
      translation: Resources["translation"] & typeof enTranslation;
    };
  }
}
