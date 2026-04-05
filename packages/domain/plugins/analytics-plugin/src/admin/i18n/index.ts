import { commonI18n } from "@trabara/core/i18n";
import ar from "./json/ar.json" with { type: "json" };
import en from "./json/en.json" with { type: "json" };
import fr from "./json/fr.json" with { type: "json" };

export default {
  ar: {
    translation: { ...commonI18n.ar.translation, ...ar },
  },
  en: {
    translation: { ...commonI18n.en.translation, ...en },
  },
  fr: {
    translation: { ...commonI18n.fr.translation, ...fr },
  },
};
