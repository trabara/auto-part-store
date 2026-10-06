// Translations of the parts module's admin. `PartsMessages` is the interface
// every locale (and any override) must provide.
import { defineTranslations } from "@repo/framework/core";
import { ar } from "./ar";
import { en } from "./en";
import { fr } from "./fr";

export type PartsMessages = typeof en;

export default defineTranslations("parts", { en, fr, ar });
