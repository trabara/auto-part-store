import { MedusaContainer } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import jwt from "jsonwebtoken";
import { createTestFitmentHierarchy } from "../fixtures/fitment-seeders";

jest.setTimeout(30000);

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Fitment ↔ Product linking", () => {
      const headers: Record<string, string> = {};
      let container: MedusaContainer;
      let userCounter = 0;

      // Helper: create a Medusa product directly via the product module service
      async function createTestProduct(title = "Test Product") {
        const productModule = container.resolve(Modules.PRODUCT);
        const [product] = await productModule.createProducts([
          {
            title,
            variants: [{ title: "Default Variant" }],
          },
        ]);
        return product;
      }

      beforeEach(async () => {
        container = getContainer();
        const authModuleService = container.resolve("auth");
        const userModuleService = container.resolve("user");

        const email = `fp-test-${++userCounter}@test.com`;

        const user = await userModuleService.createUsers({ email });

        const authIdentity = await authModuleService.createAuthIdentities({
          provider_identities: [
            {
              provider: "emailpass",
              entity_id: email,
              provider_metadata: {
                password: process.env.JWT_SECRET || "test",
              },
            },
          ],
          app_metadata: { user_id: user.id },
        });

        const token = jwt.sign(
          {
            actor_id: user.id,
            actor_type: "user",
            auth_identity_id: authIdentity.id,
          },
          process.env.JWT_SECRET || "test",
          { expiresIn: "1d" },
        );

        headers["Authorization"] = `Bearer ${token}`;
      });

      // -----------------------------------------------------------------------
      // POST /admin/fitments/:id/products  (link products to fitment)
      // -----------------------------------------------------------------------

      describe("POST /admin/fitments/:id/products", () => {
        it("should link products to a fitment and return 200", async () => {
          const { fitment } = await createTestFitmentHierarchy(container);
          const product = await createTestProduct("Link-to-Fitment");

          const res = await api.post(
            `/admin/fitments/${fitment.id}/products`,
            { product_ids: [product.id] },
            { headers },
          );

          expect(res.status).toBe(200);
          expect(res.data).toHaveProperty("fitment_id", fitment.id);
          expect(res.data.product_ids).toContain(product.id);
        });

        it("should link multiple products to a fitment", async () => {
          const { fitment } = await createTestFitmentHierarchy(container);
          const product1 = await createTestProduct("MultiLink-P1");
          const product2 = await createTestProduct("MultiLink-P2");

          const res = await api.post(
            `/admin/fitments/${fitment.id}/products`,
            { product_ids: [product1.id, product2.id] },
            { headers },
          );

          expect(res.status).toBe(200);
          expect(res.data.product_ids).toContain(product1.id);
          expect(res.data.product_ids).toContain(product2.id);
        });

        it("should return 400 when product_ids is empty", async () => {
          const { fitment } = await createTestFitmentHierarchy(container);

          await expect(
            api.post(
              `/admin/fitments/${fitment.id}/products`,
              { product_ids: [] },
              { headers },
            ),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });

        it("should return 401 without auth", async () => {
          const { fitment } = await createTestFitmentHierarchy(container);
          const product = await createTestProduct();

          await expect(
            api.post(`/admin/fitments/${fitment.id}/products`, {
              product_ids: [product.id],
            }),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });
      });

      // -----------------------------------------------------------------------
      // GET /admin/fitments/:id/products  (list products for fitment)
      // -----------------------------------------------------------------------

      describe("GET /admin/fitments/:id/products", () => {
        it("should return an empty product list when no links exist", async () => {
          const { fitment } = await createTestFitmentHierarchy(container);

          const res = await api.get(`/admin/fitments/${fitment.id}/products`, {
            headers,
          });

          expect(res.status).toBe(200);
          expect(Array.isArray(res.data.products)).toBe(true);
          expect(res.data.products).toHaveLength(0);
        });

        it("should return linked products after linking", async () => {
          const { fitment } = await createTestFitmentHierarchy(container);
          const product = await createTestProduct("Listed-Product");

          await api.post(
            `/admin/fitments/${fitment.id}/products`,
            { product_ids: [product.id] },
            { headers },
          );

          const res = await api.get(`/admin/fitments/${fitment.id}/products`, {
            headers,
          });

          expect(res.status).toBe(200);
          expect(res.data.products.some((p: any) => p.id === product.id)).toBe(
            true,
          );
        });

        it("should return 401 without auth", async () => {
          const { fitment } = await createTestFitmentHierarchy(container);

          await expect(
            api.get(`/admin/fitments/${fitment.id}/products`),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });
      });

      // -----------------------------------------------------------------------
      // DELETE /admin/fitments/:id/products/:productId  (unlink product)
      // -----------------------------------------------------------------------

      describe("DELETE /admin/fitments/:id/products/:productId", () => {
        it("should unlink a product from a fitment and return 204", async () => {
          const { fitment } = await createTestFitmentHierarchy(container);
          const product = await createTestProduct("Unlink-Me");

          await api.post(
            `/admin/fitments/${fitment.id}/products`,
            { product_ids: [product.id] },
            { headers },
          );

          const res = await api.delete(
            `/admin/fitments/${fitment.id}/products/${product.id}`,
            { headers },
          );

          expect(res.status).toBe(204);

          // Verify the link is gone
          const listRes = await api.get(
            `/admin/fitments/${fitment.id}/products`,
            { headers },
          );
          expect(
            listRes.data.products.some((p: any) => p.id === product.id),
          ).toBe(false);
        });

        it("should return 401 without auth", async () => {
          const { fitment } = await createTestFitmentHierarchy(container);
          const product = await createTestProduct();

          await api.post(
            `/admin/fitments/${fitment.id}/products`,
            { product_ids: [product.id] },
            { headers },
          );

          await expect(
            api.delete(`/admin/fitments/${fitment.id}/products/${product.id}`),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });
      });

      // -----------------------------------------------------------------------
      // POST /admin/products/:id/fitments  (link fitments to product)
      // -----------------------------------------------------------------------

      describe("POST /admin/products/:id/fitments", () => {
        it("should link fitments to a product and return 200", async () => {
          const { fitment } = await createTestFitmentHierarchy(container);
          const product = await createTestProduct("Link-to-Product");

          const res = await api.post(
            `/admin/products/${product.id}/fitments`,
            { fitment_ids: [fitment.id] },
            { headers },
          );

          expect(res.status).toBe(200);
          expect(res.data).toHaveProperty("product_id", product.id);
          expect(res.data.fitment_ids).toContain(fitment.id);
        });

        it("should link multiple fitments to a product", async () => {
          const { fitment: fitment1 } =
            await createTestFitmentHierarchy(container);
          const { fitment: fitment2 } =
            await createTestFitmentHierarchy(container);
          const product = await createTestProduct("MultiLink-Product");

          const res = await api.post(
            `/admin/products/${product.id}/fitments`,
            { fitment_ids: [fitment1.id, fitment2.id] },
            { headers },
          );

          expect(res.status).toBe(200);
          expect(res.data.fitment_ids).toContain(fitment1.id);
          expect(res.data.fitment_ids).toContain(fitment2.id);
        });

        it("should return 400 when fitment_ids is empty", async () => {
          const product = await createTestProduct();

          await expect(
            api.post(
              `/admin/products/${product.id}/fitments`,
              { fitment_ids: [] },
              { headers },
            ),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });

        it("should return 401 without auth", async () => {
          const { fitment } = await createTestFitmentHierarchy(container);
          const product = await createTestProduct();

          await expect(
            api.post(`/admin/products/${product.id}/fitments`, {
              fitment_ids: [fitment.id],
            }),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });
      });

      // -----------------------------------------------------------------------
      // GET /admin/products/:id/fitments  (list fitments for product)
      // -----------------------------------------------------------------------

      describe("GET /admin/products/:id/fitments", () => {
        it("should return an empty fitment list when no links exist", async () => {
          const product = await createTestProduct("No-Fitment-Product");

          const res = await api.get(`/admin/products/${product.id}/fitments`, {
            headers,
          });

          expect(res.status).toBe(200);
          expect(Array.isArray(res.data.fitments)).toBe(true);
          expect(res.data.fitments).toHaveLength(0);
        });

        it("should return linked fitments after linking", async () => {
          const { fitment } = await createTestFitmentHierarchy(container);
          const product = await createTestProduct("Fitment-Listed-Product");

          await api.post(
            `/admin/products/${product.id}/fitments`,
            { fitment_ids: [fitment.id] },
            { headers },
          );

          const res = await api.get(`/admin/products/${product.id}/fitments`, {
            headers,
          });

          expect(res.status).toBe(200);
          expect(res.data.fitments.some((f: any) => f.id === fitment.id)).toBe(
            true,
          );
        });

        it("should return nested model and engine data on linked fitments", async () => {
          const { fitment } = await createTestFitmentHierarchy(container);
          const product = await createTestProduct("Nested-Fitment-Product");

          await api.post(
            `/admin/products/${product.id}/fitments`,
            { fitment_ids: [fitment.id] },
            { headers },
          );

          const res = await api.get(`/admin/products/${product.id}/fitments`, {
            headers,
          });

          const found = res.data.fitments.find((f: any) => f.id === fitment.id);
          expect(found).toBeDefined();
          expect(found).toHaveProperty("model");
          expect(found).toHaveProperty("engine");
          expect(found.model).toHaveProperty("make");
        });

        it("should return 401 without auth", async () => {
          const product = await createTestProduct();

          await expect(
            api.get(`/admin/products/${product.id}/fitments`),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });
      });

      // -----------------------------------------------------------------------
      // DELETE /admin/products/:id/fitments/:fitmentId  (unlink fitment)
      // -----------------------------------------------------------------------

      describe("DELETE /admin/products/:id/fitments/:fitmentId", () => {
        it("should unlink a fitment from a product and return 204", async () => {
          const { fitment } = await createTestFitmentHierarchy(container);
          const product = await createTestProduct("Unlink-Fitment-Product");

          await api.post(
            `/admin/products/${product.id}/fitments`,
            { fitment_ids: [fitment.id] },
            { headers },
          );

          const res = await api.delete(
            `/admin/products/${product.id}/fitments/${fitment.id}`,
            { headers },
          );

          expect(res.status).toBe(204);

          // Verify the link is gone
          const listRes = await api.get(
            `/admin/products/${product.id}/fitments`,
            { headers },
          );
          expect(
            listRes.data.fitments.some((f: any) => f.id === fitment.id),
          ).toBe(false);
        });

        it("should return 401 without auth", async () => {
          const { fitment } = await createTestFitmentHierarchy(container);
          const product = await createTestProduct();

          await api.post(
            `/admin/products/${product.id}/fitments`,
            { fitment_ids: [fitment.id] },
            { headers },
          );

          await expect(
            api.delete(`/admin/products/${product.id}/fitments/${fitment.id}`),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });
      });

      // -----------------------------------------------------------------------
      // DELETE /admin/fitments/:id  (should also dismiss product links)
      // -----------------------------------------------------------------------

      describe("DELETE /admin/fitments/:id (link cascade)", () => {
        it("should remove fitment-product links when fitment is deleted", async () => {
          const { fitment } = await createTestFitmentHierarchy(container);
          const product = await createTestProduct("Cascade-Delete-Product");

          // Link the fitment to the product
          await api.post(
            `/admin/products/${product.id}/fitments`,
            { fitment_ids: [fitment.id] },
            { headers },
          );

          // Delete the fitment via the workflow (which dismisses links)
          await api.delete(`/admin/fitments/${fitment.id}`, { headers });

          // The product's fitment list should now be empty
          const listRes = await api.get(
            `/admin/products/${product.id}/fitments`,
            { headers },
          );
          expect(
            listRes.data.fitments.some((f: any) => f.id === fitment.id),
          ).toBe(false);
        });
      });
    });
  },
});
