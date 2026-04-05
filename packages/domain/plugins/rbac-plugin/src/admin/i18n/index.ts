import en from "./json/en.json" with { type: "json" };
import fr from "./json/fr.json" with { type: "json" };
import ar from "./json/ar.json" with { type: "json" };
import { commonI18n } from "@trabara/core/i18n";

export default {
  ar: { translation: { ...commonI18n.ar, ...ar } },
  en: { translation: { ...commonI18n.en, ...en } },
  fr: { translation: { ...commonI18n.fr, ...fr } },
};
