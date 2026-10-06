// Translations of the automotive domain's own admin text (`modules.automotive.*`):
// widget titles and the condition attribute catalog (src/conditions).
import { defineTranslations } from "@repo/framework/core";
import { ar } from "./ar";
import { en } from "./en";
import { fr } from "./fr";

export type AutomotiveMessages = typeof en;

export default defineTranslations("automotive", { en, fr, ar });
