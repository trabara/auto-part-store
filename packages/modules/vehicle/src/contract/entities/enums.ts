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
