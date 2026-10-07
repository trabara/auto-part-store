// Translations of the fitment module's admin. `FitmentMessages` is the
// interface every locale (and any override) must provide.
import { defineTranslations } from "@repo/framework/core";
import { ar } from "./ar";
import { en } from "./en";
import { fr } from "./fr";

export type FitmentMessages = typeof en;

export default defineTranslations("fitments", { en, fr, ar });
