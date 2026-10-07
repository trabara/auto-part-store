import { adminUrl } from "../helpers/admin-url";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { adminHeaders } from "@repo/config/jest/medusa-helpers.cjs";

jest.setTimeout(60 * 1000);

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let admin: { headers: Record<string, string> };
    let publishableKey: string;

    beforeEach(async () => {
      admin = await adminHeaders(getContainer());
      const { data } = await api.post("/admin/api-keys", { title: "Store", type: "publishable" }, admin);
      publishableKey = data.api_key.token;
    });

    /** Registers and logs in a customer; returns store request headers. */
    const customer = async (email: string) => {
      const store = { "x-publishable-api-key": publishableKey };
      const reg = await api.post("/auth/customer/emailpass/register", { email, password: "secret123" });
      await api.post(
        "/store/customers",
        { email, first_name: email.split("@")[0] },
        { headers: { ...store, authorization: `Bearer ${reg.data.token}` } },
      );
      const login = await api.post("/auth/customer/emailpass", { email, password: "secret123" });
      return { headers: { ...store, authorization: `Bearer ${login.data.token}` } };
    };

    /** A vehicle (make › model › generation › configuration) to park in garages. */
    let seq = 0;
    const vehicle = async () => {
      const post = (entity: string, body: object) =>
        api.post(adminUrl(entity), body, admin).then((r) => r.data.data);
      const make = await post("vehicle_make", { name: `Make ${++seq}`, slug: null });
      const model = await post("vehicle_model", { name: "Model", slug: null, make_id: make.id });
      const generation = await post("vehicle_generation", {
        name: "Mk1", code: null, year_start: 2010, year_end: null, image: null, model_id: model.id,
      });
      const engine = await post("vehicle_engine", {
        code: null, layout: "INLINE", cylinders: 4, displacement_cc: 1400, power_kw: 60 + seq,
      });
      return post("vehicle", { generation_id: generation.id, engine_id: engine.id, trim: null, year_start: 2012, year_end: null });
    };

    const fail = (p: Promise<any>) => p.then((r) => r).catch((e) => e.response);

    it("requires a logged-in customer", async () => {
      const res = await fail(api.get("/store/garage", { headers: { "x-publishable-api-key": publishableKey } }));
      expect(res.status).toBe(401);
    });

    it("adds, lists, updates and removes the customer's own vehicles", async () => {
      const jane = await customer("jane@example.com");
      const car = await vehicle();

      const added = await api.post(
        "/store/garage",
        { vehicle_id: car.id, nickname: "Daily", vin: "wvwzzz1kz8w000001", registration: "ab-123-cd", is_default: true },
        jane,
      );
      expect(added.status).toBe(201);
      expect(added.data.vehicle).toMatchObject({
        nickname: "Daily",
        vin: "WVWZZZ1KZ8W000001",
        registration: "AB-123-CD",
        is_default: true,
        vehicle_label: expect.stringMatching(/^Make \d+ Model Mk1 2012– · 1\.4 gasoline I4 \d+ kW/),
      });

      const list = await api.get("/store/garage", jane);
      expect(list.data.vehicles.map((v: any) => v.id)).toEqual([added.data.vehicle.id]);

      const renamed = await api.put(`/store/garage/${added.data.vehicle.id}`, { nickname: "Weekend" }, jane);
      expect(renamed.data.vehicle.nickname).toBe("Weekend");

      await api.delete(`/store/garage/${added.data.vehicle.id}`, jane);
      expect((await api.get("/store/garage", jane)).data.vehicles).toEqual([]);
    });

    it("validates the VIN", async () => {
      const joe = await customer("joe@example.com");
      const car = await vehicle();
      const bad = await fail(
        api.post("/store/garage", { vehicle_id: car.id, nickname: null, vin: "IOQ123", registration: null }, joe),
      );
      expect(bad.status).toBe(400);
    });

    it("keeps one default vehicle per customer", async () => {
      const ann = await customer("ann@example.com");
      const [a, b] = [await vehicle(), await vehicle()];
      const body = { nickname: null, vin: null, registration: null, is_default: true };
      const first = (await api.post("/store/garage", { ...body, vehicle_id: a.id }, ann)).data.vehicle;
      const second = (await api.post("/store/garage", { ...body, vehicle_id: b.id }, ann)).data.vehicle;

      const list = (await api.get("/store/garage", ann)).data.vehicles;
      const isDefault = Object.fromEntries(list.map((v: any) => [v.id, v.is_default]));
      expect(isDefault).toEqual({ [first.id]: false, [second.id]: true });
    });

    it("never exposes or touches another customer's garage", async () => {
      const [owner, other] = [await customer("owner@example.com"), await customer("other@example.com")];
      const car = await vehicle();
      const mine = (
        await api.post("/store/garage", { vehicle_id: car.id, nickname: "Mine", vin: null, registration: null }, owner)
      ).data.vehicle;

      expect((await api.get("/store/garage", other)).data.vehicles).toEqual([]);
      expect((await fail(api.put(`/store/garage/${mine.id}`, { nickname: "Stolen" }, other))).status).toBe(404);
      expect((await fail(api.delete(`/store/garage/${mine.id}`, other))).status).toBe(404);

      // A customer_id in the body is rejected (unknown field): no one can park
      // a vehicle in someone else's garage.
      const otherId = (await api.get("/store/customers/me", other)).data.customer.id;
      const sneaky = await fail(
        api.post(
          "/store/garage",
          { vehicle_id: car.id, nickname: "Sneaky", vin: null, registration: null, customer_id: otherId },
          owner,
        ),
      );
      expect(sneaky.status).toBe(400);
      expect((await api.get("/store/garage", other)).data.vehicles).toEqual([]);
    });
  },
});
