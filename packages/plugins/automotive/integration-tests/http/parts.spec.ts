import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { createStep, createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { createEntitiesStep } from "@repo/framework/entity/server";
import { adminHeaders } from "@repo/config/jest/medusa-helpers.cjs";
import { PARTS_MODULE, type PartsModuleService } from "../../src/modules/parts";

const failStep = createStep("parts-test-fail", async () => {
  throw new Error("boom");
});
const createThenFail = createWorkflow("parts-test-create-then-fail", (input: any) => {
  const created = createEntitiesStep(input);
  failStep();
  return new WorkflowResponse(created);
});

jest.setTimeout(60 * 1000);

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let headers: { headers: Record<string, string> };

    beforeEach(async () => {
      headers = await adminHeaders(getContainer());
    });

    const post = (entity: string, body: object) =>
      api.post(`/admin/parts/${entity}`, body, headers).then((r) => r.data.data);
    const failure = (p: Promise<any>) => p.then(() => ({ status: 200, data: {} })).catch((e) => e.response);

    /** Values of the shared "Brand" option, by value text. */
    const brandValues = async () => {
      const { data } = await api.get("/admin/product-options?title=Brand&fields=id,*values", headers);
      const option = data.product_options[0];
      return option
        ? { optionId: option.id as string, values: option.values.map((v: any) => v.value).sort() }
        : { optionId: undefined, values: [] as string[] };
    };

    /** A product using the shared Brand option, one variant per brand name. */
    const createBrandProduct = async (title: string, brands: { name: string; option_value_id: string }[]) => {
      const { optionId } = await brandValues();
      const { data } = await api.post(
        "/admin/products",
        {
          title,
          options: [{ id: optionId, value_ids: brands.map((b) => b.option_value_id) }],
          variants: brands.map((b, i) => ({
            title: b.name,
            sku: `${title}-${i}`.toUpperCase().replace(/\s/g, "-"),
            options: { Brand: b.name },
            prices: [],
          })),
        },
        headers,
      );
      return data.product as { id: string; variants: { id: string; title: string }[] };
    };

    describe("brands own the shared Brand option's values", () => {
      it("creates a value for sold brands only, with a derived slug", async () => {
        const bosch = await post("brand", { name: "Bosch", logo: null, kind: "AFTERMARKET" });
        const toyota = await post("brand", { name: "Toyota", logo: null, kind: "OE" });

        expect(bosch).toMatchObject({ slug: "bosch", option_value_id: expect.any(String) });
        expect(toyota.option_value_id).toBeNull();
        expect((await brandValues()).values).toEqual(["Bosch"]);
      });

      it("rejects a duplicate name with a readable message", async () => {
        await post("brand", { name: "Brembo", logo: null, kind: "AFTERMARKET" });
        const dup = await failure(api.post("/admin/parts/brand", { name: "BREMBO", logo: null }, headers));
        expect(dup.status).toBe(400);
        expect(dup.data.message).toBe("A brand with this name already exists.");
      });

      it("renames the option value with the brand; variants follow", async () => {
        const trw = await post("brand", { name: "TRW", logo: null, kind: "AFTERMARKET" });
        const product = await createBrandProduct("Rename pads", [trw]);

        const renamed = await api.put(`/admin/parts/brand/${trw.id}`, { name: "TRW Automotive" }, headers);
        expect(renamed.data.data).toMatchObject({ slug: "trw-automotive", option_value_id: trw.option_value_id });
        expect((await brandValues()).values).toContain("TRW Automotive");

        const { data } = await api.get(
          `/admin/products/${product.id}/variants/${product.variants[0]!.id}?fields=*options`,
          headers,
        );
        expect(data.variant.options.map((o: any) => o.value)).toEqual(["TRW Automotive"]);
      });

      it("resolves a variant's brand through the option value (read-only link)", async () => {
        const ate = await post("brand", { name: "ATE", logo: null, kind: "AFTERMARKET" });
        const product = await createBrandProduct("Link pads", [ate]);
        const { data } = await getContainer().resolve("query").graph({
          entity: "product_variant",
          fields: ["id", "options.value", "options.brand.id", "options.brand.name"],
          filters: { id: product.variants[0]!.id },
        });
        expect(data[0].options[0]).toMatchObject({ value: "ATE", brand: { id: ate.id, name: "ATE" } });

        // The admin widget's lookup: brands by any of the variant's option values.
        const { data: list } = await api.get(
          `/admin/parts/brand?option_value_id[]=${ate.option_value_id}&option_value_id[]=optval_other&fields=id`,
          headers,
        );
        expect(list.data.map((b: any) => b.id)).toEqual([ate.id]);
      });

      it("refuses to delete (or make OE-only) a brand variants use; removes unused values", async () => {
        const used = await post("brand", { name: "Ferodo", logo: null, kind: "AFTERMARKET" });
        const unused = await post("brand", { name: "Mintex", logo: null, kind: "AFTERMARKET" });
        await createBrandProduct("Delete pads", [used]);

        const refused = await failure(api.delete(`/admin/parts/brand/${used.id}`, headers));
        expect(refused.status).toBe(400);
        expect(refused.data.message).toMatch(/^Brand Ferodo is used by 1 variant;/);
        const toOe = await failure(api.put(`/admin/parts/brand/${used.id}`, { kind: "OE" }, headers));
        expect(toOe.status).toBe(400);
        expect((await brandValues()).values).toContain("Ferodo");

        await api.delete(`/admin/parts/brand/${unused.id}`, headers);
        expect((await brandValues()).values).not.toContain("Mintex");
      });

      it("follows kind changes: OE-only drops the value, sold again gets one", async () => {
        const zf = await post("brand", { name: "ZF", logo: null, kind: "AFTERMARKET" });
        const oe = await api.put(`/admin/parts/brand/${zf.id}`, { kind: "OE" }, headers);
        expect(oe.data.data.option_value_id).toBeNull();
        expect((await brandValues()).values).not.toContain("ZF");

        const sold = await api.put(`/admin/parts/brand/${zf.id}`, { kind: "BOTH" }, headers);
        expect(sold.data.data.option_value_id).toEqual(expect.any(String));
        expect((await brandValues()).values).toContain("ZF");
      });

      it("rolls back the option value with the brand", async () => {
        const { errors } = await createThenFail(getContainer()).run({
          input: { module: PARTS_MODULE, entity: "Brand", data: [{ name: "Ghost", logo: null, kind: "AFTERMARKET" }] },
          throwOnError: false,
        });
        expect(errors[0]?.error?.message).toBe("boom");
        expect((await brandValues()).values).not.toContain("Ghost");
        const brands = await getContainer()
          .resolve<PartsModuleService>(PARTS_MODULE)
          .listBrands({ name: "Ghost" }, { withDeleted: true });
        expect(brands).toEqual([]);
      });
    });

    describe("part numbers", () => {
      it("normalizes numbers, finds them however they are typed, and rejects duplicates", async () => {
        const bosch = await post("brand", { name: "Bosch PN", logo: null, kind: "AFTERMARKET" });
        const product = await createBrandProduct("Number pads", [bosch]);
        const variant_id = product.variants[0]!.id;

        const mpn = await post("part_number", { variant_id, brand_id: bosch.id, type: "MPN", number: "0 986 494-123" });
        expect(mpn.number_normalized).toBe("0986494123");

        const found = await api.get(
          `/admin/parts/part_number?number_normalized=${encodeURIComponent("0986.494.123")}&fields=id`,
          headers,
        );
        expect(found.data.data.map((n: any) => n.id)).toEqual([mpn.id]);

        const dup = await failure(
          api.post("/admin/parts/part_number", { variant_id, brand_id: bosch.id, type: "MPN", number: "0986494123" }, headers),
        );
        expect(dup.status).toBe(400);
        expect(dup.data.message).toBe("This number is already listed for this part.");
      });

      it("finds interchangeable variants through a shared OE number", async () => {
        const toyota = await post("brand", { name: "Toyota OE", logo: null, kind: "OE" });
        const [a, b, c] = [
          await post("brand", { name: "Brand A", logo: null, kind: "AFTERMARKET" }),
          await post("brand", { name: "Brand B", logo: null, kind: "AFTERMARKET" }),
          await post("brand", { name: "Brand C", logo: null, kind: "AFTERMARKET" }),
        ];
        const product = await createBrandProduct("Equivalent pads", [a, b, c]);
        const [va, vb, vc] = product.variants.map((v) => v.id);
        await post("part_number", { variant_id: va, brand_id: toyota.id, type: "OE", number: "04465-02220" });
        await post("part_number", { variant_id: vb, brand_id: toyota.id, type: "OE", number: "0446502220" });
        // Same digits under another brand is a different number.
        await post("part_number", { variant_id: vc, brand_id: c.id, type: "MPN", number: "04465 02220" });

        const parts = getContainer().resolve<PartsModuleService>(PARTS_MODULE);
        expect(await parts.equivalentVariantIds(va!)).toEqual([vb]);
        expect(await parts.equivalentVariantIds(vc!)).toEqual([]);
      });
    });
  },
});
