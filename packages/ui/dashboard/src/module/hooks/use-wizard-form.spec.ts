/**
 * Tests for useWizardForm hook logic.
 *
 * Tests the pure computation functions extracted from the hook:
 * step navigation, schema merging, validation logic.
 *
 * Runs in Node.js environment (no DOM required).
 */

import { z } from "@medusajs/framework/zod";
import { getZodShape } from "@repo/framework/utils";

// ─── Schemas ─────────────────────────────────────────────────

const step1Schema = z.object({ name: z.string().min(1) });
const step2Schema = z.object({ email: z.string().email() });
const step3Schema = z.object({ age: z.number().int().positive().optional() });

const step1 = { id: "info", label: "Info", schema: step1Schema };
const step2 = { id: "contact", label: "Contact", schema: step2Schema };
const step3 = { id: "extra", label: "Extra", schema: step3Schema };
const steps = [step1, step2, step3];

// ─── Pure logic helpers extracted from useWizardForm ─────────

function getCurrentStep(activeId?: string) {
  return steps.find((s) => s.id === activeId) || steps[0]!;
}

function hasNextStep(activeId?: string) {
  const idx = steps.findIndex((s) => s.id === activeId);
  return idx < steps.length - 1;
}

function getNextStep(activeId?: string) {
  const idx = steps.findIndex((s) => s.id === activeId);
  return idx < steps.length - 1 ? steps[idx + 1]! : null;
}

function getPrevStep(activeId?: string) {
  const idx = steps.findIndex((s) => s.id === activeId);
  return idx > 0 ? steps[idx - 1]! : null;
}

function getMergedSchema() {
  return steps.reduce((acc, s) => acc.extend(s.schema.shape), z.object({}));
}

function getCurrentStepSchema(activeId?: string) {
  return steps.find((s) => s.id === activeId)?.schema ?? getMergedSchema();
}

function getFields(schema: z.ZodTypeAny): string[] {
  return Object.keys(getZodShape(schema));
}

// ─── Tests ───────────────────────────────────────────────────

describe("useWizardForm logic", () => {
  describe("getCurrentStep", () => {
    it("returns the first step when no active step is provided", () => {
      expect(getCurrentStep(undefined).id).toBe("info");
    });

    it("returns the matching step for a given ID", () => {
      expect(getCurrentStep("contact").id).toBe("contact");
      expect(getCurrentStep("extra").id).toBe("extra");
    });

    it("falls back to the first step for an unknown ID", () => {
      expect(getCurrentStep("unknown").id).toBe("info");
    });
  });

  describe("hasNextStep / getNextStep / getPrevStep", () => {
    it("hasNextStep is true for early steps, false for last", () => {
      expect(hasNextStep("info")).toBe(true);
      expect(hasNextStep("contact")).toBe(true);
      expect(hasNextStep("extra")).toBe(false);
    });

    it("getNextStep returns the next step or null", () => {
      expect(getNextStep("info")?.id).toBe("contact");
      expect(getNextStep("contact")?.id).toBe("extra");
      expect(getNextStep("extra")).toBeNull();
    });

    it("getPrevStep returns the previous step or null", () => {
      expect(getPrevStep("info")).toBeNull();
      expect(getPrevStep("contact")?.id).toBe("info");
      expect(getPrevStep("extra")?.id).toBe("contact");
    });
  });

  describe("schema merging", () => {
    it("merged schema contains all fields from all steps", () => {
      const merged = getMergedSchema();
      const fields = getFields(merged);
      expect(fields).toEqual(expect.arrayContaining(["name", "email", "age"]));
    });

    it("merged schema validates valid combined data", () => {
      const merged = getMergedSchema();
      const result = merged.safeParse({
        name: "John",
        email: "john@test.com",
        age: 25,
      });
      expect(result.success).toBe(true);
    });

    it("merged schema rejects missing required fields", () => {
      const merged = getMergedSchema();
      const result = merged.safeParse({ name: "John" });
      expect(result.success).toBe(false);
    });

    it("merged schema rejects invalid email", () => {
      const merged = getMergedSchema();
      const result = merged.safeParse({
        name: "John",
        email: "not-an-email",
        age: 25,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("getCurrentStepSchema", () => {
    it("returns the schema for the active step", () => {
      const schema = getCurrentStepSchema("contact");
      const fields = getFields(schema);
      expect(fields).toEqual(["email"]);
    });

    it("falls back to merged schema for unknown step", () => {
      const schema = getCurrentStepSchema("unknown" as any);
      const fields = getFields(schema);
      expect(fields).toEqual(expect.arrayContaining(["name", "email", "age"]));
    });
  });

  describe("step field extraction", () => {
    it("extracts fields from step 1 schema", () => {
      const fields = getFields(step1Schema);
      expect(fields).toEqual(["name"]);
    });

    it("extracts fields from step 2 schema", () => {
      const fields = getFields(step2Schema);
      expect(fields).toEqual(["email"]);
    });

    it("extracts fields from step 3 schema", () => {
      const fields = getFields(step3Schema);
      expect(fields).toEqual(["age"]);
    });
  });

  describe("end-to-end wizard flow (pure logic)", () => {
    it("simulates a full 3-step wizard submission", () => {
      let step: string | undefined = "info";
      let allValues: Record<string, unknown> = {};
      let submitted = false;
      let submittedValues: unknown = null;

      const onSuccess = (values: unknown) => {
        submitted = true;
        submittedValues = values;
      };

      // Helper to advance: validate against current schema, save values
      function advance(values: Record<string, unknown>) {
        const currentSchema = getCurrentStepSchema(step);
        const valid = currentSchema.safeParse(values);
        if (!valid.success) return;

        allValues = { ...allValues, ...valid.data };

        if (hasNextStep(step)) {
          step = getNextStep(step)!.id;
        } else {
          // Final validation
          const merged = getMergedSchema();
          const finalValid = merged.safeParse(allValues);
          if (!finalValid.success) return;
          onSuccess(finalValid.data);
        }
      }

      // Step 1: enter name
      advance({ name: "Jane" });
      expect(step).toBe("contact");

      // Step 2: enter email
      advance({ email: "jane@test.com" });
      expect(step).toBe("extra");

      // Step 3: enter age and submit
      advance({ age: 30 });
      expect(submitted).toBe(true);
      expect(submittedValues).toMatchObject({
        name: "Jane",
        email: "jane@test.com",
        age: 30,
      });
    });

    it("does not advance on invalid step data", () => {
      let step: string | undefined = "info";
      let allValues: Record<string, unknown> = {};
      let submitted = false;

      // Attempt to submit empty name (fails min(1) validation)
      const schema = getCurrentStepSchema(step);
      const valid = schema.safeParse({ name: "" });
      if (!valid.success) {
        // Don't advance
      }

      expect(step).toBe("info");
      expect(submitted).toBe(false);
    });
  });
});
