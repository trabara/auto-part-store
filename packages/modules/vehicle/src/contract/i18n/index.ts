// Translations of the vehicle module's admin. `VehicleMessages` is the
// interface every locale (and any override) must provide.
import { defineTranslations } from "@repo/framework/core";
import { ar } from "./ar";
import { en } from "./en";
import { fr } from "./fr";

export type VehicleMessages = typeof en;

export default defineTranslations("vehicles", { en, fr, ar });
