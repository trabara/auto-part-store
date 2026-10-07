// Vehicle enums and their schemas.
import { z } from "@medusajs/framework/zod";

export enum FuelType {
  GASOLINE = "GASOLINE",
  DIESEL = "DIESEL",
  ELECTRIC = "ELECTRIC",
  HYBRID = "HYBRID",
  PLUG_IN_HYBRID = "PLUG_IN_HYBRID",
  LPG = "LPG",
  CNG = "CNG",
  HYDROGEN = "HYDROGEN",
}
export const FuelTypeSchema = z.enum(FuelType);

/** Cylinder arrangement; ELECTRIC_MOTOR for battery-electric drives. */
export enum EngineLayout {
  INLINE = "INLINE",
  V = "V",
  BOXER = "BOXER",
  W = "W",
  ROTARY = "ROTARY",
  ELECTRIC_MOTOR = "ELECTRIC_MOTOR",
}
export const EngineLayoutSchema = z.enum(EngineLayout);

export enum Drive {
  FWD = "FWD",
  RWD = "RWD",
  AWD = "AWD",
  FOUR_WD = "FOUR_WD",
}
export const DriveSchema = z.enum(Drive);

export enum Transmission {
  MANUAL = "MANUAL",
  AUTOMATIC = "AUTOMATIC",
  DUAL_CLUTCH = "DUAL_CLUTCH",
  CVT = "CVT",
}
export const TransmissionSchema = z.enum(Transmission);

export enum BodyStyle {
  SEDAN = "SEDAN",
  SUV = "SUV",
  HATCHBACK = "HATCHBACK",
  COUPE = "COUPE",
  CONVERTIBLE = "CONVERTIBLE",
  WAGON = "WAGON",
  MINIVAN = "MINIVAN",
  VAN = "VAN",
  PICKUP = "PICKUP",
  CHASSIS_CAB = "CHASSIS_CAB",
  MOTORCYCLE = "MOTORCYCLE",
}
export const BodyStyleSchema = z.enum(BodyStyle);

export enum VehicleCategory {
  CAR = "CAR",
  /** Light commercial vehicle (vans, pickups up to 3.5 t). */
  LCV = "LCV",
  TRUCK = "TRUCK",
  MOTORCYCLE = "MOTORCYCLE",
}

/** Catalogs a vehicle can be identified in. */
export enum VehicleReferenceSource {
  TECDOC_KTYPE = "TECDOC_KTYPE",
  ACES_VEHICLE_ID = "ACES_VEHICLE_ID",
  ACES_BASE_VEHICLE = "ACES_BASE_VEHICLE",
  OTHER = "OTHER",
}

/**
 * How far a record's values can be trusted, by where they came from (in this
 * order). Imports overwrite a value only from a higher tier, and never a
 * HUMAN one (staff edits).
 */
export enum SourceTier {
  /** Bulk data nobody reviewed (e.g. the Wikipedia draft). */
  DRAFT = "DRAFT",
  /** AI research whose evidence was checked against its source. */
  RESEARCH = "RESEARCH",
  /** Curated sources and reviewed proposals. */
  REFERENCE = "REFERENCE",
  /** Licensed catalogs (car2db, TecDoc). */
  LICENSED = "LICENSED",
  /** Edited by staff in the admin. */
  HUMAN = "HUMAN",
}
export const SourceTierSchema = z.enum(SourceTier);

/** What a catalog maintenance task does. */
export enum CatalogTaskKind {
  /** Find the generations of a model that has none. */
  RESEARCH_GENERATIONS = "RESEARCH_GENERATIONS",
  /** Find the configurations of a generation. */
  RESEARCH_CONFIGURATIONS = "RESEARCH_CONFIGURATIONS",
  /** Check a model and its generations against their source. */
  VERIFY_MODEL = "VERIFY_MODEL",
  /** Check a generation's configurations and engines against their source. */
  VERIFY_GENERATION = "VERIFY_GENERATION",
  /** A rule finding a person should settle (duplicate, implausible value). */
  CLEANUP = "CLEANUP",
}
export const CatalogTaskKindSchema = z.enum(CatalogTaskKind);

export enum CatalogTaskStatus {
  PENDING = "PENDING",
  /** Leased by a worker. */
  RUNNING = "RUNNING",
  /** The last run changed or confirmed catalog data. */
  APPLIED = "APPLIED",
  /** Waiting for a person (a proposal or a finding). */
  REVIEW = "REVIEW",
  /** Nothing found; tried again later. */
  NO_DATA = "NO_DATA",
  /** The last run failed; tried again later. */
  FAILED = "FAILED",
  /** Closed: resolved, approved, rejected or no longer needed. */
  DONE = "DONE",
}
export const CatalogTaskStatusSchema = z.enum(CatalogTaskStatus);

/** The catalog entities a task or finding can be about. */
export enum CatalogEntityName {
  VehicleMake = "VehicleMake",
  VehicleModel = "VehicleModel",
  VehicleGeneration = "VehicleGeneration",
  VehicleEngine = "VehicleEngine",
  Vehicle = "Vehicle",
  VehicleReference = "VehicleReference",
}
export const CatalogEntityNameSchema = z.enum(CatalogEntityName);
