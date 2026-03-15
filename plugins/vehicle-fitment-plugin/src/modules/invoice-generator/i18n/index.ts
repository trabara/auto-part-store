import ar from "./json/ar.json";
import en from "./json/en.json";
import fr from "./json/fr.json";

export function getTranslations(locale: string = "en") {
    const translations: Record<string, Record<string, string>> = {
        en,
        fr,
        ar,
    };
    return translations[locale] || translations.en;
}
