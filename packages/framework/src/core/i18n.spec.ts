import { COMMON_MESSAGES, defineTranslations, humanizeValue, i18nKeys, localizedText, toAdminI18n, translator, type SameShape } from "./i18n";

const en = {
  name: "Vehicles",
  features: { vehicle_make: "Makes" },
  entities: { VehicleMake: { name: "Make", fields: { name: "Name" }, values: { kind: { OEM: "OEM" } } } },
};
const fr: SameShape<typeof en> = {
  name: "Véhicules",
  features: { vehicle_make: "Marques" },
  entities: { VehicleMake: { name: "Marque", fields: { name: "Nom" }, values: { kind: { OEM: "Constructeur" } } } },
};

describe("defineTranslations", () => {
  it("requires every English key in each locale", () => {
    // @ts-expect-error — "ar" lacks features.vehicle_make
    defineTranslations("vehicles", { en, fr, ar: { ...fr, features: {} } });
    expect(defineTranslations("vehicles", { en, fr, ar: fr }).module).toBe("vehicles");
  });
});

describe("toAdminI18n", () => {
  it("puts module messages under modules.<path> and entity labels under entities.<Name>", () => {
    const resources = toAdminI18n(
      defineTranslations("vehicles", { en, fr, ar: fr }),
      defineTranslations("parts", {
        en: { name: "Parts" },
        fr: { name: "Pièces" },
        ar: { name: "قطع الغيار" },
      }),
    );
    expect(resources.fr.translation).toEqual({
      modules: { vehicles: { name: "Véhicules", features: { vehicle_make: "Marques" } }, parts: { name: "Pièces" } },
      entities: fr.entities,
      erp: {
        fields: expect.objectContaining({ created_at: "Créé le" }),
        ui: expect.objectContaining({ createEntity: "Créer : {{name}}" }),
      },
    });
    expect(Object.keys(resources)).toEqual(["en", "fr", "ar"]);
  });

  it("refuses an entity translated by two modules", () => {
    const a = defineTranslations("a", { en, fr, ar: fr });
    const b = defineTranslations("b", { en, fr, ar: fr });
    expect(() => toAdminI18n(a, b)).toThrow(/entity "VehicleMake" is translated by two modules/);
  });
});

describe("keys", () => {
  it("match the resource layout", () => {
    expect(i18nKeys.feature("vehicles", "vehicle_make")).toBe("modules.vehicles.features.vehicle_make");
    expect(i18nKeys.field("VehicleMake", "name")).toBe("entities.VehicleMake.fields.name");
    expect(i18nKeys.value("VehicleEngine", "fuel", "DIESEL")).toBe("entities.VehicleEngine.values.fuel.DIESEL");
    expect(i18nKeys.entity("VehicleMake", true)).toBe("entities.VehicleMake.plural");
  });

  it("humanizes enum values by default", () => {
    expect(humanizeValue("PLUG_IN_HYBRID")).toBe("Plug in hybrid");
    expect(humanizeValue("SUV")).toBe("SUV");
    expect(humanizeValue("FWD")).toBe("FWD");
  });
});

describe("COMMON_MESSAGES", () => {
  it("translates every UI message in every locale", () => {
    const keys = Object.keys(COMMON_MESSAGES.en.ui).sort();
    for (const locale of ["fr", "ar"] as const) expect(Object.keys(COMMON_MESSAGES[locale].ui).sort()).toEqual(keys);
  });
});

describe("translator and localizedText", () => {
  const resources = toAdminI18n(
    defineTranslations("x", {
      en: { messages: { hi: "Hello {{name}}" } },
      fr: { messages: { hi: "Bonjour {{name}}" } },
      ar: { messages: { hi: "مرحبا {{name}}" } },
    }),
  );

  it("translates by key for a locale, with fallback and variables", () => {
    expect(translator(resources, "fr-FR")("modules.x.messages.hi", "Hi", { name: "Ali" })).toBe("Bonjour Ali");
    expect(translator(resources, "de")("modules.x.messages.hi", "Hi {{name}}", { name: "Ali" })).toBe("Hi Ali");
    expect(translator(resources, "fr")("modules.x.messages.nope", "Fallback")).toBe("Fallback");
  });

  it("picks the locale's text, else English", () => {
    expect(localizedText({ en: "Diesel", fr: "Gazole" }, "fr-TN")).toBe("Gazole");
    expect(localizedText({ en: "Diesel", fr: "Gazole" }, "ar")).toBe("Diesel");
    expect(localizedText(null, "fr")).toBeNull();
  });
});
