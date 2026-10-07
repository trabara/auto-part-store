// Translations of the garage module. `GarageMessages` is the interface every
// locale (and any override) must provide.
import { defineTranslations } from "@repo/framework/core";
import { ar } from "./ar";
import { en } from "./en";
import { fr } from "./fr";

export type GarageMessages = typeof en;

export default defineTranslations("garage", { en, fr, ar });
