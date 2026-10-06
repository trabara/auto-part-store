import type { SameShape } from "@repo/framework/core";
import type { en } from "./en";

export const fr: SameShape<typeof en> = {
  name: "Véhicules",
  features: {
    vehicle: "Configurations",
    vehicle_make: "Marques",
    vehicle_model: "Modèles",
    vehicle_generation: "Générations",
    vehicle_engine: "Moteurs",
    vehicle_reference: "Identifiants catalogue",
    customer_vehicle: "Garage",
  },
  steps: {
    vehicle: { general: "Général", specs: "Caractéristiques" },
  },
  messages: {
    units: { hp: "ch" },
  },
  entities: {
    Vehicle: {
      name: "Véhicule",
      plural: "Véhicules",
      fields: {
        generation: "Génération",
        engine: "Moteur",
        references: "Identifiants catalogue",
        trim: "Finition",
        year_start: "Première année de production",
        year_end: "Dernière année de production",
        body_style: "Carrosserie",
        doors: "Portes",
        drive: "Transmission (roues motrices)",
        transmission: "Boîte de vitesses",
      },
      values: {
        body_style: {
          SEDAN: "Berline",
          SUV: "SUV",
          HATCHBACK: "Compacte (hayon)",
          COUPE: "Coupé",
          CONVERTIBLE: "Cabriolet",
          WAGON: "Break",
          MINIVAN: "Monospace",
          VAN: "Fourgon",
          PICKUP: "Pick-up",
          CHASSIS_CAB: "Châssis-cabine",
          MOTORCYCLE: "Moto",
        },
        drive: { FWD: "Traction avant", RWD: "Propulsion", AWD: "Transmission intégrale", FOUR_WD: "4×4" },
        transmission: { MANUAL: "Manuelle", AUTOMATIC: "Automatique", DUAL_CLUTCH: "Double embrayage", CVT: "CVT" },
      },
    },
    VehicleMake: {
      name: "Marque",
      plural: "Marques",
      fields: { name: "Nom", slug: "Slug", logo: "Logo", models: "Modèles" },
    },
    VehicleModel: {
      name: "Modèle",
      plural: "Modèles",
      fields: { make: "Marque", name: "Nom", slug: "Slug", image: "Image", category: "Catégorie", generations: "Générations" },
      values: {
        category: { CAR: "Voiture", LCV: "Utilitaire léger", TRUCK: "Camion", MOTORCYCLE: "Moto" },
      },
    },
    VehicleGeneration: {
      name: "Génération",
      plural: "Générations",
      fields: {
        model: "Modèle",
        name: "Nom",
        code: "Code",
        year_start: "Première année de production",
        year_end: "Dernière année de production",
        image: "Image",
        vehicles: "Configurations",
      },
    },
    VehicleEngine: {
      name: "Moteur",
      plural: "Moteurs",
      fields: {
        code: "Code moteur",
        name: "Technologie",
        fuel: "Carburant",
        layout: "Architecture",
        cylinders: "Cylindres",
        displacement_cc: "Cylindrée (cm³)",
        power_kw: "Puissance (kW)",
        power_hp: "Puissance (ch)",
        vehicles: "Configurations",
      },
      values: {
        fuel: {
          GASOLINE: "Essence",
          DIESEL: "Diesel",
          ELECTRIC: "Électrique",
          HYBRID: "Hybride",
          PLUG_IN_HYBRID: "Hybride rechargeable",
          LPG: "GPL",
          CNG: "GNV",
          HYDROGEN: "Hydrogène",
        },
        layout: { INLINE: "En ligne", V: "En V", BOXER: "À plat (boxer)", W: "En W", ROTARY: "Rotatif", ELECTRIC_MOTOR: "Moteur électrique" },
      },
    },
    VehicleReference: {
      name: "Identifiant catalogue",
      plural: "Identifiants catalogue",
      fields: { vehicle: "Véhicule", source: "Source", external_id: "Identifiant externe" },
      values: {
        source: {
          TECDOC_KTYPE: "TecDoc K-type",
          ACES_VEHICLE_ID: "ACES vehicle ID",
          ACES_BASE_VEHICLE: "ACES base vehicle",
          OTHER: "Autre",
        },
      },
    },
    CustomerVehicle: {
      name: "Véhicule du garage",
      plural: "Garage",
      fields: {
        customer: "Client",
        vehicle: "Véhicule",
        nickname: "Surnom",
        vin: "VIN",
        registration: "Immatriculation",
        is_default: "Véhicule par défaut",
        build_year: "Année de fabrication",
        build_month: "Mois de fabrication",
      },
    },
  },
};
