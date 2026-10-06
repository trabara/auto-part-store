import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { adminHeaders } from "@repo/config/jest/medusa-helpers.cjs";
import { FITMENT_MODULE } from "@repo/module-fitment";

jest.setTimeout(120 * 1000);

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let admin: { headers: Record<string, string> };
    let store: { headers: Record<string, string> };
    let c: Record<string, any>; // catalog fixture

    const post = (path: string, body: object) => api.post(path, body, admin).then((r) => r.data);
    const entity = (scope: string, name: string, body: object) =>
      post(`/admin/${scope}/${name}`, body).then((d) => d.data);

    beforeEach(async () => {
      admin = await adminHeaders(getContainer());
      c = {};

      // Storefront context: a sales channel, its publishable key, a TND region.
      c.channel = (await post("/admin/sales-channels", { name: "Web" })).sales_channel;
      c.otherChannel = (await post("/admin/sales-channels", { name: "Shop" })).sales_channel;
      const key = (await post("/admin/api-keys", { title: "Web", type: "publishable" })).api_key;
      await post(`/admin/api-keys/${key.id}/sales-channels`, { add: [c.channel.id] });
      store = { headers: { "x-publishable-api-key": key.token } };
      const [storeRow] = (await api.get("/admin/stores", admin)).data.stores;
      await post(`/admin/stores/${storeRow.id}`, {
        supported_currencies: [{ currency_code: "eur", is_default: true }, { currency_code: "tnd" }],
      });
      c.region = (await post("/admin/regions", { name: "Tunisia", currency_code: "tnd", countries: ["tn"] })).region;

      // Vehicles: Peugeot 308 T9 (2013–2021), FWD and AWD configurations.
      const make = await entity("vehicles", "vehicle_make", { name: "Peugeot", slug: null });
      const model = await entity("vehicles", "vehicle_model", { name: "308", slug: null, make_id: make.id });
      c.generation = await entity("vehicles", "vehicle_generation", {
        name: "T9", code: null, year_start: 2013, year_end: 2021, image: null, model_id: model.id,
      });
      const engine = await entity("vehicles", "vehicle_engine", {
        code: "DV6", fuel: "DIESEL", layout: "INLINE", cylinders: 4, displacement_cc: 1560, power_kw: 88,
      });
      const vehicle = (drive: string) =>
        entity("vehicles", "vehicle", {
          generation_id: c.generation.id, engine_id: engine.id, trim: null, drive, year_start: 2014, year_end: 2020,
        });
      c.fwd = await vehicle("FWD");
      c.awd = await vehicle("AWD");

      // Model B product: "Front brake pad set" with Bosch / Brembo variants.
      c.bosch = await entity("parts", "brand", { name: "Bosch", logo: null, kind: "AFTERMARKET" });
      c.brembo = await entity("parts", "brand", { name: "Brembo", logo: null, kind: "AFTERMARKET" });
      c.psa = await entity("parts", "brand", { name: "PSA", logo: null, kind: "OE" });
      const { product_options } = (await api.get("/admin/product-options?title=Brand&fields=id", admin)).data;
      const product = (title: string, status: string, channel: string, brands: any[]) =>
        post("/admin/products", {
          title,
          status,
          sales_channels: [{ id: channel }],
          options: [{ id: product_options[0].id, value_ids: brands.map((b) => b.option_value_id) }],
          variants: brands.map((b) => ({
            title: b.name,
            sku: `${title}-${b.name}`.toUpperCase().replace(/\s/g, "-"),
            options: { Brand: b.name },
            manage_inventory: false,
            prices: [{ currency_code: "tnd", amount: 45.5 }],
          })),
        }).then((d) => d.product);
      c.pads = await product("Front brake pad set", "published", c.channel.id, [c.bosch, c.brembo]);
      c.wipers = await product("Wiper blades", "published", c.channel.id, [c.bosch]);
      c.draft = await product("Draft pads", "draft", c.channel.id, [c.bosch]);
      c.elsewhere = await product("Shop-only pads", "published", c.otherChannel.id, [c.bosch]);
      const variant = (p: any, brand: string) => p.variants.find((v: any) => v.title === brand).id;
      c.padsBosch = variant(c.pads, "Bosch");
      c.padsBrembo = variant(c.pads, "Brembo");

      // Fitments.
      const position = await entity("fitments", "fitment_position", { code: "FRONT", name: "Front axle", category: null });
      const fit = (variant_id: string, vehicle_id: string, extra = {}) =>
        entity("fitments", "fitment", {
          variant_id, vehicle_id, position_id: position.id, quantity: 1, notes: null,
          from_year: null, from_month: null, to_year: null, to_month: null, ...extra,
        });
      await fit(c.padsBosch, c.fwd.id, { quantity: 2 });
      await fit(c.padsBrembo, c.fwd.id, { from_year: 2018, from_month: 6 });
      await fit(variant(c.draft, "Bosch"), c.fwd.id);
      await fit(variant(c.elsewhere, "Bosch"), c.fwd.id);
      // On the AWD configuration, Bosch pads fit only front-wheel drives (condition).
      const awdFit = await fit(c.padsBosch, c.awd.id);
      const fitments = getContainer().resolve<any>(FITMENT_MODULE);
      const [drive] = await fitments.createAutomotiveAttributes([
        { code: "drive", name: "Drive", data_type: "enum", default_unit: null, category: null },
      ]);
      const [group] = await fitments.createFitmentConditionGroups([{ operator: "and", fitment_id: awdFit.id }]);
      await fitments.createFitmentConditions([
        { operator: "eq", value: "FWD", value_to: null, unit: null, group_id: group.id, attribute_id: drive.id },
      ]);

      // Part numbers: Bosch MPN; both pads share PSA's OE number.
      const number = (variant_id: string, brand_id: string, type: string, value: string) =>
        entity("parts", "part_number", { variant_id, brand_id, type, number: value });
      await number(c.padsBosch, c.bosch.id, "MPN", "0 986 494 262");
      await number(c.padsBosch, c.psa.id, "OE", "4253.90");
      await number(c.padsBrembo, c.psa.id, "OE", "425390");
    });

    const variantsOf = (products: any[]) => products.flatMap((p) => p.variants.map((v: any) => v.id)).sort();

    it("needs a publishable key", async () => {
      const res = await api.get("/store/vehicles/makes").catch((e) => e.response);
      expect(res.status).toBe(400);
    });

    it("serves the vehicle selector, narrowed by year", async () => {
      const makes = (await api.get("/store/vehicles/makes", store)).data.makes;
      expect(makes.map((m: any) => m.name)).toEqual(["Peugeot"]);
      const models = (await api.get(`/store/vehicles/models?make_id=${makes[0].id}`, store)).data.models;
      expect(models.map((m: any) => [m.name, m.category])).toEqual([["308", "CAR"]]);

      const gens = (year: number) =>
        api.get(`/store/vehicles/generations?model_id=${models[0].id}&year=${year}`, store).then((r) => r.data.generations);
      expect((await gens(2016)).map((g: any) => g.label)).toEqual(["Peugeot 308 T9 2013–2021"]);
      expect(await gens(2023)).toEqual([]);

      const vehicles = (await api.get(`/store/vehicles?generation_id=${c.generation.id}&year=2016`, store)).data.vehicles;
      expect(vehicles.map((v: any) => v.drive).sort()).toEqual(["AWD", "FWD"]);
      expect(vehicles[0].label).toMatch(/^Peugeot 308 T9 2014–2020 · 1\.6 diesel I4 88 kW \(118 hp\) DV6$/);

      const missing = await api.get("/store/vehicles/models", store).catch((e) => e.response);
      expect(missing.status).toBe(400);
    });

    it("lists published, channel-visible parts fitting a vehicle, with fitments, brand and TND price", async () => {
      const { data } = await api.get(`/store/vehicles/${c.fwd.id}/parts?region_id=${c.region.id}`, store);
      expect(data.vehicle.label).toMatch(/^Peugeot 308 T9 2014–2020/);
      expect(data.count).toBe(1);
      expect(data.products.map((p: any) => p.title)).toEqual(["Front brake pad set"]);
      expect(variantsOf(data.products)).toEqual([c.padsBosch, c.padsBrembo].sort());

      const bosch = data.products[0].variants.find((v: any) => v.id === c.padsBosch);
      expect(bosch.brand).toMatchObject({ id: c.bosch.id, name: "Bosch" });
      expect(bosch.fitments).toEqual([expect.objectContaining({ quantity: 2, position: expect.objectContaining({ code: "FRONT" }) })]);
      expect(bosch.calculated_price).toMatchObject({ currency_code: "tnd", calculated_amount: 45.5 });
    });

    it("narrows production windows by build date", async () => {
      const ids = (q: string) =>
        api.get(`/store/vehicles/${c.fwd.id}/parts?${q}`, store).then((r) => variantsOf(r.data.products));
      expect(await ids("build_year=2017")).toEqual([c.padsBosch]);
      expect(await ids("build_year=2018&build_month=3")).toEqual([c.padsBosch]);
      expect(await ids("build_year=2018&build_month=7")).toEqual([c.padsBosch, c.padsBrembo].sort());
      // Without a month, a window starting mid-2018 still applies to 2018.
      expect(await ids("build_year=2018")).toEqual([c.padsBosch, c.padsBrembo].sort());
    });

    it("applies fitment conditions to the vehicle", async () => {
      const { data } = await api.get(`/store/vehicles/${c.awd.id}/parts`, store);
      expect(data.products).toEqual([]);
    });

    it("filters by brand and pages by product", async () => {
      const byBrand = await api.get(`/store/vehicles/${c.fwd.id}/parts?brand_id=${c.brembo.id}`, store);
      expect(variantsOf(byBrand.data.products)).toEqual([c.padsBrembo]);
      const paged = await api.get(`/store/vehicles/${c.fwd.id}/parts?limit=1&offset=1`, store);
      expect([paged.data.count, paged.data.products]).toEqual([1, []]);
    });

    it("finds parts by any number, however typed, with equivalents", async () => {
      const byMpn = (await api.get(`/store/parts/search?q=${encodeURIComponent("0986-494262")}`, store)).data;
      expect(byMpn.normalized).toBe("0986494262");
      const variants = byMpn.products.flatMap((p: any) => p.variants);
      expect(variants.find((v: any) => v.id === c.padsBosch).matches).toEqual([
        { type: "MPN", number: "0 986 494 262", brand: "Bosch" },
      ]);
      // Brembo shares PSA's OE number with the Bosch pads.
      expect(variants.find((v: any) => v.id === c.padsBrembo)).toMatchObject({ matches: [], equivalent_of: c.padsBosch });

      const byOe = (await api.get("/store/parts/search?q=4253.90", store)).data;
      expect(variantsOf(byOe.products)).toEqual([c.padsBosch, c.padsBrembo].sort());
      expect((await api.get("/store/parts/search?q=99999", store)).data.products).toEqual([]);
    });

    it("uses a garage vehicle's build date", async () => {
      const email = "garage@example.com";
      const reg = await api.post("/auth/customer/emailpass/register", { email, password: "secret123" });
      await api.post("/store/customers", { email }, { headers: { ...store.headers, authorization: `Bearer ${reg.data.token}` } });
      const login = await api.post("/auth/customer/emailpass", { email, password: "secret123" });
      const me = { headers: { ...store.headers, authorization: `Bearer ${login.data.token}` } };

      const garage = (
        await api.post("/store/garage", {
          vehicle_id: c.fwd.id, nickname: null, vin: null, registration: null, build_year: 2017, build_month: null,
        }, me)
      ).data.vehicle;
      const { data } = await api.get(`/store/garage/${garage.id}/parts`, me);
      expect(data.garage_vehicle.build_year).toBe(2017);
      expect(variantsOf(data.products)).toEqual([c.padsBosch]);
    });
  },
});
