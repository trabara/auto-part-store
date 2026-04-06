import {
  FITMENT_MODULE,
  FitmentModuleService,
} from "@repo/domain-modules/fitment";
import { MedusaContainer } from "@medusajs/framework/types";

// ── Makes ─────────────────────────────────────────────────────────────────────

export async function createTestMake(
  container: MedusaContainer,
  overrides?: { name?: string },
) {
  const service = container.resolve<FitmentModuleService>(FITMENT_MODULE);
  const [make] = (await service.createFitmentMakes([
    { name: overrides?.name ?? `Make-${Date.now()}` },
  ])) as any[];
  return make;
}

// ── Models ────────────────────────────────────────────────────────────────────

export async function createTestModel(
  container: MedusaContainer,
  makeId: string,
  overrides?: { name?: string },
) {
  const service = container.resolve<FitmentModuleService>(FITMENT_MODULE);
  const [model] = await service.createFitmentModels([
    {
      name: overrides?.name ?? `Model-${Date.now()}`,
      make_id: makeId,
    },
  ]);
  return model;
}

// ── Engines ───────────────────────────────────────────────────────────────────

export async function createTestEngine(
  container: MedusaContainer,
  overrides?: {
    fuel?: "GASOLINE" | "DIESEL" | "ELECTRIC" | "HYBRID";
    type?: "I4" | "V4" | "V6" | "V8" | "ELECTRIC" | "HYBRID";
    size?: string;
    tech?: string;
  },
) {
  const service = container.resolve<FitmentModuleService>(FITMENT_MODULE);
  const [engine] = await service.createFitmentEngines([
    {
      fuel: overrides?.fuel ?? "GASOLINE",
      type: overrides?.type ?? "I4",
      size: overrides?.size ?? String(Math.floor(Math.random() * 90 + 10) / 10),
      tech: overrides?.tech,
    },
  ]);
  return engine;
}

// ── Fitments ──────────────────────────────────────────────────────────────────

export async function createTestFitment(
  container: MedusaContainer,
  modelId: string,
  engineId: string,
  overrides?: {
    body_style?:
      | "SEDAN"
      | "SUV"
      | "HATCHBACK"
      | "COUPE"
      | "CONVERTIBLE"
      | "WAGON"
      | "VAN"
      | "PICKUP";
    doors?: number;
    drive?: "FWD" | "RWD" | "AWD" | "FOUR_WD";
    transmission?: "MANUAL" | "AUTOMATIC" | "CVT";
    year_start?: number;
    year_end?: number;
  },
) {
  const service = container.resolve<FitmentModuleService>(FITMENT_MODULE);
  const [fitment] = await service.createFitments([
    {
      model_id: modelId,
      engine_id: engineId,
      body_style: overrides?.body_style ?? "SEDAN",
      doors: overrides?.doors ?? 4,
      drive: overrides?.drive ?? "FWD",
      transmission: overrides?.transmission ?? "MANUAL",
      year_start: overrides?.year_start ?? 2020,
      year_end: overrides?.year_end,
    },
  ]);
  return fitment;
}

// ── Convenience: full hierarchy ───────────────────────────────────────────────

/**
 * Creates a complete hierarchy: Make → Model + Engine → Fitment.
 * Returns all four entities for use in tests.
 */
export async function createTestFitmentHierarchy(
  container: MedusaContainer,
  overrides?: {
    makeName?: string;
    modelName?: string;
    engineSize?: string;
    fitmentYear?: number;
  },
) {
  const make = await createTestMake(container, { name: overrides?.makeName });
  const model = await createTestModel(container, make.id, {
    name: overrides?.modelName,
  });
  const engine = await createTestEngine(container, {
    size: overrides?.engineSize,
  });
  const fitment = await createTestFitment(container, model.id, engine.id, {
    year_start: overrides?.fitmentYear ?? 2020,
  });
  return { make, model, engine, fitment };
}
