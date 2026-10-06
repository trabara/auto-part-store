import { adminUrl } from "../admin-url";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { adminHeaders } from "@repo/config/jest/medusa-helpers.cjs";

jest.setTimeout(120 * 1000);

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let admin: { headers: Record<string, string> };
    let store: { headers: Record<string, string> };
    let c: Record<string, any>;

    const post = (path: string, body: object) => api.post(path, body, admin).then((r) => r.data);
    const entity = (name: string, body: object) => post(adminUrl(name), body).then((d) => d.data);
    const fail = (p: Promise<any>) => p.catch((e) => e.response);

    beforeEach(async () => {
      admin = await adminHeaders(getContainer());
      c = {};
      const channel = (await post("/admin/sales-channels", { name: "Web" })).sales_channel;
      const key = (await post("/admin/api-keys", { title: "Web", type: "publishable" })).api_key;
      await post(`/admin/api-keys/${key.id}/sales-channels`, { add: [channel.id] });
      store = { headers: { "x-publishable-api-key": key.token } };

      const make = await entity("vehicle_make", { name: "Renault", slug: null });
      const model = await entity("vehicle_model", { name: "Clio", slug: null, make_id: make.id });
      const generation = await entity("vehicle_generation", {
        name: "V", code: null, year_start: 2019, year_end: null, image: null, model_id: model.id,
      });
      const engine = (power_kw: number, fuel: string) =>
        entity("vehicle_engine", { code: null, fuel, layout: "INLINE", cylinders: 4, displacement_cc: 1500, power_kw });
      const vehicle = async (power_kw: number, fuel: string, drive: string) =>
        entity("vehicle", {
          generation_id: generation.id, engine_id: (await engine(power_kw, fuel)).id, trim: null, drive,
          year_start: 2020, year_end: null,
        });
      c.diesel = await vehicle(85, "DIESEL", "FWD");
      c.petrol = await vehicle(74, "GASOLINE", "FWD");

      const product = (
        await post("/admin/products", {
          title: "Oil filter",
          status: "published",
          sales_channels: [{ id: channel.id }],
          options: [{ title: "Default", values: ["Default"] }],
          variants: [{ title: "Default", options: { Default: "Default" }, manage_inventory: false, prices: [] }],
        })
      ).product;
      c.variant = product.variants[0].id;
      const fit = (vehicle_id: string) =>
        entity("fitment", {
          variant_id: c.variant, vehicle_id, position_id: null, quantity: 1, notes: null,
          from_year: null, from_month: null, to_year: null, to_month: null,
        });
      c.dieselFit = await fit(c.diesel.id);
      c.petrolFit = await fit(c.petrol.id);
    });

    const dieselOnly = {
      operator: "and",
      conditions: [{ code: "engine.fuel", operator: "eq", value: "DIESEL" }],
      groups: [
        {
          operator: "or",
          conditions: [
            { code: "drive", operator: "in", value: ["FWD", "AWD"] },
            { code: "engine.power_kw", operator: "between", value: 80, value_to: 120 },
          ],
          groups: [],
        },
      ],
    };

    it("saves a condition tree as a whole, with a readable summary", async () => {
      for (const id of [c.dieselFit.id, c.petrolFit.id]) {
        const { data } = await api.put(`/admin/fitments/fitment/${id}/conditions`, { tree: dieselOnly }, admin);
        expect(data.summary).toBe(
          "Fuel is diesel and (Drive is one of front-wheel drive, all-wheel drive or Power is between 80 and 120 kW)",
        );
      }

      const { data } = await api.get(`/admin/fitments/fitment/${c.dieselFit.id}/conditions`, admin);
      expect(data.tree).toMatchObject(dieselOnly);

      const fitment = await api.get(`/admin/fitments/fitment/${c.dieselFit.id}?fields=id,conditions_summary`, admin);
      expect(fitment.data.data.conditions_summary).toBe(data.summary);
    });

    it("creates missing attributes from the vehicle catalog, typed from the field", async () => {
      await api.put(`/admin/fitments/fitment/${c.dieselFit.id}/conditions`, { tree: dieselOnly }, admin);
      const { data } = await api.get("/admin/fitments/automotive_attribute?fields=code,name,data_type,default_unit", admin);
      const byCode = Object.fromEntries(data.data.map((a: any) => [a.code, a]));
      expect(byCode).toMatchObject({
        "engine.fuel": { name: "Fuel", data_type: "enum" },
        drive: { name: "Drive", data_type: "enum" },
        "engine.power_kw": { name: "Power", data_type: "number", default_unit: "kW" },
      });
    });

    it("rejects invalid trees with every problem listed", async () => {
      const res = await fail(
        api.put(
          `/admin/fitments/fitment/${c.dieselFit.id}/conditions`,
          {
            tree: {
              operator: "and",
              conditions: [
                { code: "drive", operator: "gt", value: "FWD" },
                { code: "engine.power_kw", operator: "between", value: 120, value_to: 80 },
              ],
              groups: [],
            },
          },
          admin,
        ),
      );
      expect(res.status).toBe(400);
      expect(res.data.message).toBe(
        "Conditions › #1: Drive can't use \"is above\". Conditions › #2: the upper bound of Power is below the lower one.",
      );
      // Nothing was saved.
      expect((await api.get(`/admin/fitments/fitment/${c.dieselFit.id}/conditions`, admin)).data.tree).toBeNull();
    });

    it("drives the storefront: non-matching vehicles lose the part, matches show the summary", async () => {
      await api.put(`/admin/fitments/fitment/${c.petrolFit.id}/conditions`, { tree: dieselOnly }, admin);
      await api.put(`/admin/fitments/fitment/${c.dieselFit.id}/conditions`, { tree: dieselOnly }, admin);

      const parts = (id: string) => api.get(`/store/vehicles/${id}/parts`, store).then((r) => r.data.products);
      expect(await parts(c.petrol.id)).toEqual([]);
      const diesel = await parts(c.diesel.id);
      expect(diesel[0].variants[0].fitments[0].conditions).toMatch(/^Fuel is diesel and/);
    });

    it("removes all conditions with a null tree", async () => {
      await api.put(`/admin/fitments/fitment/${c.petrolFit.id}/conditions`, { tree: dieselOnly }, admin);
      const { data } = await api.put(`/admin/fitments/fitment/${c.petrolFit.id}/conditions`, { tree: null }, admin);
      expect(data).toEqual({ tree: null, summary: null });
      const parts = await api.get(`/store/vehicles/${c.petrol.id}/parts`, store);
      expect(parts.data.products).toHaveLength(1);
    });

    it("manages attributes from the catalog: type derived, unknown fields refused", async () => {
      const created = await entity("automotive_attribute", {
        code: "engine.displacement_cc", name: "Cylinder capacity", default_unit: "cm³", category: "Engine",
      });
      expect(created).toMatchObject({ code: "engine.displacement_cc", data_type: "number" });
      const bad = await fail(
        api.post("/admin/fitments/automotive_attribute", { code: "colour", name: "Colour", default_unit: null, category: null }, admin),
      );
      expect(bad.status).toBe(400);
    });

    it("404s for an unknown fitment", async () => {
      expect((await fail(api.get("/admin/fitments/fitment/nope/conditions", admin))).status).toBe(404);
    });
  },
});
