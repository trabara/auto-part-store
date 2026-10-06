import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { createStep, createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { deleteEntitiesStep } from "@repo/framework/entity/server";
import { adminHeaders } from "@repo/config/jest/medusa-helpers.cjs";
import { removeOrphansWorkflow } from "../../src/workflows/remove-orphans";
import { FITMENT_MODULE } from "@repo/module-fitment";
import { VEHICLE_MODULE } from "@repo/module-vehicle";

const failStep = createStep("orphans-test-fail", async () => {
  throw new Error("boom");
});
const deleteThenFail = createWorkflow("orphans-test-delete-then-fail", (input: any) => {
  const deleted = deleteEntitiesStep(input);
  failStep();
  return new WorkflowResponse(deleted);
});

jest.setTimeout(120 * 1000);

/** Retries until `check` passes (subscribers run after the request returns). */
async function eventually(check: () => Promise<void>, ms = 8000) {
  const until = Date.now() + ms;
  for (;;) {
    try {
      return await check();
    } catch (error) {
      if (Date.now() > until) throw error;
      await new Promise((r) => setTimeout(r, 200));
    }
  }
}

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let admin: { headers: Record<string, string> };
    let c: Record<string, any>;
    const post = (path: string, body: object) => api.post(path, body, admin).then((r) => r.data);
    const entity = (scope: string, name: string, body: object) => post(`/admin/${scope}/${name}`, body).then((d) => d.data);
    const fail = (p: Promise<any>) => p.catch((e) => e.response);
    const live = async (scope: string, name: string, filter: string) =>
      (await api.get(`/admin/${scope}/${name}?${filter}&fields=id`, admin)).data.data.map((r: any) => r.id);

    beforeEach(async () => {
      admin = await adminHeaders(getContainer());
      c = {};
      const make = await entity("vehicles", "vehicle_make", { name: "Dacia", slug: null });
      const model = await entity("vehicles", "vehicle_model", { name: "Sandero", slug: null, make_id: make.id });
      c.generation = await entity("vehicles", "vehicle_generation", {
        name: "III", code: null, year_start: 2020, year_end: null, image: null, model_id: model.id,
      });
      const engine = await entity("vehicles", "vehicle_engine", {
        code: "H4D", layout: "INLINE", cylinders: 3, displacement_cc: 999, power_kw: 49,
      });
      c.vehicle = await entity("vehicles", "vehicle", {
        generation_id: c.generation.id, engine_id: engine.id, trim: "Stepway", year_start: 2021, year_end: null,
      });
      c.product = (
        await post("/admin/products", {
          title: "Air filter",
          options: [{ title: "Default", values: ["A", "B"] }],
          variants: ["A", "B"].map((v) => ({ title: v, options: { Default: v }, prices: [] })),
        })
      ).product;
      [c.variantA, c.variantB] = c.product.variants.map((v: any) => v.id);
      c.brand = await entity("parts", "brand", { name: "Mann", logo: null, kind: "AFTERMARKET" });
      const fit = (variant_id: string) =>
        entity("fitments", "fitment", {
          variant_id, vehicle_id: c.vehicle.id, position_id: null, quantity: 1, notes: null,
          from_year: null, from_month: null, to_year: null, to_month: null,
        });
      c.fitA = await fit(c.variantA);
      c.fitB = await fit(c.variantB);
      c.numberA = await entity("parts", "part_number", { variant_id: c.variantA, brand_id: c.brand.id, type: "MPN", number: "C 1234" });
    });

    describe("linked ids must exist", () => {
      it("rejects unknown variants and vehicles", async () => {
        const body = { position_id: null, quantity: 1, notes: null, from_year: null, from_month: null, to_year: null, to_month: null };
        const badVariant = await fail(api.post("/admin/fitments/fitment", { ...body, variant_id: "variant_nope", vehicle_id: c.vehicle.id }, admin));
        expect([badVariant.status, badVariant.data.message]).toEqual([400, 'Product variant "variant_nope" not found.']);
        const badVehicle = await fail(api.put(`/admin/fitments/fitment/${c.fitA.id}`, { vehicle_id: "veh_nope" }, admin));
        expect([badVehicle.status, badVehicle.data.message]).toEqual([400, 'Vehicle "veh_nope" not found.']);
      });
    });

    describe("deletions cascade", () => {
      it("deleting a variant removes its fitments and part numbers", async () => {
        await api.delete(`/admin/products/${c.product.id}/variants/${c.variantA}`, admin);
        await eventually(async () => {
          expect(await live("fitments", "fitment", `variant_id=${c.variantA}`)).toEqual([]);
          expect(await live("parts", "part_number", `variant_id=${c.variantA}`)).toEqual([]);
        });
        expect(await live("fitments", "fitment", `variant_id=${c.variantB}`)).toEqual([c.fitB.id]);
      });

      it("deleting a product removes its variants' fitments", async () => {
        await api.delete(`/admin/products/${c.product.id}`, admin);
        await eventually(async () => {
          expect(await live("fitments", "fitment", `vehicle_id=${c.vehicle.id}`)).toEqual([]);
        });
      });

      it("deleting a vehicle removes its fitments and garage entries, restored on rollback", async () => {
        const vehicles = getContainer().resolve<any>(VEHICLE_MODULE);
        await vehicles.createCustomerVehicles([{ customer_id: "cus_x", vehicle_id: c.vehicle.id, nickname: null, vin: null, registration: null }]);

        await deleteThenFail(getContainer()).run({
          input: { module: VEHICLE_MODULE, entity: "Vehicle", ids: [c.vehicle.id] },
          throwOnError: false,
        });
        expect(await live("fitments", "fitment", `vehicle_id=${c.vehicle.id}`)).toHaveLength(2);
        expect(await vehicles.listCustomerVehicles({ vehicle_id: c.vehicle.id })).toHaveLength(1);

        await api.delete(`/admin/vehicles/vehicle/${c.vehicle.id}`, admin);
        expect(await live("fitments", "fitment", `vehicle_id=${c.vehicle.id}`)).toEqual([]);
        expect(await vehicles.listCustomerVehicles({ vehicle_id: c.vehicle.id })).toEqual([]);
      });

      it("deleting a customer removes their garage", async () => {
        const customer = (await post("/admin/customers", { email: "gone@example.com" })).customer;
        const vehicles = getContainer().resolve<any>(VEHICLE_MODULE);
        await vehicles.createCustomerVehicles([{ customer_id: customer.id, vehicle_id: c.vehicle.id, nickname: null, vin: null, registration: null }]);
        await api.delete(`/admin/customers/${customer.id}`, admin);
        await eventually(async () => {
          expect(await vehicles.listCustomerVehicles({ customer_id: customer.id })).toEqual([]);
        });
      });

      it("the cleanup script removes orphans left from before", async () => {
        // An orphan written directly (bypassing the workflow checks).
        await getContainer().resolve<any>(FITMENT_MODULE).createFitments([
          { variant_id: "variant_gone", vehicle_id: c.vehicle.id, quantity: 1 },
        ]);
        expect((await removeOrphansWorkflow(getContainer()).run({ input: { all: true } })).result).toEqual({ fitments: 1, partNumbers: 0, garage: 0 });
        expect((await removeOrphansWorkflow(getContainer()).run({ input: { all: true } })).result).toEqual({ fitments: 0, partNumbers: 0, garage: 0 });
        expect(await live("fitments", "fitment", `vehicle_id=${c.vehicle.id}`)).toHaveLength(2);
      });
    });

    describe("search (?q=)", () => {
      it("matches every word against the label's text fields", async () => {
        const ids = (q: string) => live("vehicles", "vehicle", `q=${encodeURIComponent(q)}`);
        expect(await ids("sandero")).toEqual([c.vehicle.id]);
        expect(await ids("dacia stepway")).toEqual([c.vehicle.id]);
        expect(await ids("h4d")).toEqual([c.vehicle.id]); // engine code
        expect(await ids("dacia gti")).toEqual([]);
        expect(await live("parts", "brand", "q=man")).toEqual([c.brand.id]);
      });
    });
  },
});
