import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import jwt from "jsonwebtoken";

jest.setTimeout(60 * 1000);

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let headers: { headers: Record<string, string> };

    beforeEach(async () => {
      const container = getContainer();
      const user = await container
        .resolve(Modules.USER)
        .createUsers({ email: "admin@test.local" });
      const { projectConfig } = container.resolve(
        ContainerRegistrationKeys.CONFIG_MODULE,
      );
      const token = jwt.sign(
        { actor_id: user.id, actor_type: "user", auth_identity_id: "test" },
        projectConfig.http.jwtSecret as string,
        { expiresIn: "1d" },
      );
      headers = { headers: { authorization: `Bearer ${token}` } };
    });

    const status = (p: Promise<any>) =>
      p.then((r) => r.status).catch((e) => e.response?.status);

    describe("entity allowlist", () => {
      it("404s for models not exposed by the generic routes", async () => {
        for (const entity of ["fitment_condition", "automotive_attribute", "nope"]) {
          expect(await status(api.get(`/admin/automotive/${entity}`, headers))).toBe(404);
          expect(await status(api.post(`/admin/automotive/${entity}`, {}, headers))).toBe(404);
          expect(
            await status(api.delete(`/admin/automotive/${entity}/x`, headers)),
          ).toBe(404);
        }
      });
    });

    describe("vehicle engine CRUD", () => {
      it("creates, filters, updates (engine DTO) and deletes", async () => {
        const created = await api.post(
          "/admin/automotive/vehicle_engine",
          { fuel: "DIESEL", type: "V6", size: "3.0", power: 250 },
          headers,
        );
        expect(created.status).toBe(201);
        const id = created.data.data.id;

        const list = await api.get(
          "/admin/automotive/vehicle_engine?power[$gte]=200&fuel=DIESEL",
          headers,
        );
        expect(list.status).toBe(200);
        expect(list.data.data.map((e: any) => e.id)).toEqual([id]);

        const empty = await api.get(
          "/admin/automotive/vehicle_engine?power[$gte]=300",
          headers,
        );
        expect(empty.data.data).toEqual([]);

        // Engine fields validate; previously validated by the vehicle DTO.
        const updated = await api.put(
          `/admin/automotive/vehicle_engine/${id}`,
          { power: 300 },
          headers,
        );
        expect(updated.status).toBe(200);
        expect(updated.data.data.power).toBe(300);

        const batch = await api.put(
          "/admin/automotive/vehicle_engine",
          { entities: [{ id, name: "turbo" }] },
          headers,
        );
        expect(batch.status).toBe(200);

        const detail = await api.get(
          `/admin/automotive/vehicle_engine/${id}?fields=id,power,name`,
          headers,
        );
        expect(detail.data.data).toEqual({ id, power: 300, name: "turbo" });

        const deleted = await api.delete(`/admin/automotive/vehicle_engine/${id}`, headers);
        expect(deleted.data).toEqual({ id, object: "vehicle_engine", deleted: true });
      });

      it("rejects an invalid engine payload with 400", async () => {
        expect(
          await status(
            api.post("/admin/automotive/vehicle_engine", { fuel: "STEAM" }, headers),
          ),
        ).toBe(400);
      });
    });
  },
});
