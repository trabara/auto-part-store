import { z } from "@medusajs/framework/zod";
import { defineModule } from "@repo/framework/core";
import { defineEntity } from "@repo/framework/entity";
import { relationOverrides } from "../helpers/relation-overrides";
import { entityFields, toQueryFilters } from "./query";
import { entityUrl, featureFor, featurePath, featureRelations } from "./routes";

const Make = defineEntity("DashMake", {
  schema: z.object({ id: z.string(), name: z.string() }),
  relations: (r) => ({ models: r.hasMany("DashModel", { mappedBy: "make" }) }),
});
const Model = defineEntity("DashModel", {
  schema: z.object({ id: z.string(), name: z.string(), year: z.number(), fuel: z.enum(["a", "b"]) }),
  relations: (r) => ({
    make: r.belongsTo("DashMake", { mappedBy: "models" }),
    parent: r.belongsTo("DashModel", { nullable: true }),
    secret: r.belongsTo("DashSecret"),
  }),
});
defineEntity("DashSecret", { schema: z.object({ id: z.string() }) });

const mod = defineModule({
  name: "Cat",
  path: "catalog",
  features: (m) => ({
    make: m.crud(Make),
    model: m.crud(Model, { relations: { secret: { hidden: true }, make: { label: "Brand" } } }),
  }),
});

describe("toQueryFilters", () => {
  it("turns text filters into $ilike and passes other values through", () => {
    expect(
      toQueryFilters(
        { name: "cor", year: { $gte: 2010 }, fuel: ["a"], empty: "", gone: undefined },
        Model.schema,
      ),
    ).toEqual({ name: { $ilike: "%cor%" }, year: { $gte: 2010 }, fuel: ["a"] });
  });
});

describe("entityFields", () => {
  it("selects own fields plus visible to-one relations", () => {
    expect(entityFields(mod, mod.features.model).split(",")).toEqual([
      "id",
      "name",
      "year",
      "fuel",
      "make_id",
      "parent_id",
      "secret_id",
      "*make",
      "*parent",
    ]);
  });
});

describe("routes helpers", () => {
  it("builds API urls and admin paths", () => {
    expect(entityUrl(mod, Model)).toBe("/admin/catalog/dash_model");
    expect(entityUrl(mod, Model, "a b")).toBe("/admin/catalog/dash_model/a%20b");
    expect(featurePath(mod.features.model, "detail", { id: "42" })).toBe("/catalog/dash-models/42");
    expect(featurePath(mod.features.model, "edit", { id: "42" })).toBe("/catalog/dash-models/42/edit");
    expect(featureFor(mod, "DashMake")).toBe(mod.features.make);
  });

  it("resolves visible relations with labels and target features", () => {
    const relations = featureRelations(mod, mod.features.model);
    expect(relations.map((r) => [r.key, r.label, r.target?.key])).toEqual([
      ["make", "Brand", "make"],
      ["parent", "Parent", "model"],
    ]);
  });
});

describe("relationOverrides", () => {
  it("renders a picker for each FK field of the schema, labelled from the relation", () => {
    const overrides = relationOverrides(mod, mod.features.model, Model.dto.create) as Record<string, any>;
    expect(Object.keys(overrides).sort()).toEqual(["make_id", "parent_id"]);
    expect(overrides.make_id.label).toBe("Brand");

    const picker = overrides.parent_id.render({ value: undefined, onChange: () => {} });
    expect(picker.props).toMatchObject({
      url: "/admin/catalog/dash_model",
      displayField: "name",
      clearable: true,
      value: null,
    });
  });

  it("ignores FKs missing from the schema", () => {
    expect(relationOverrides(mod, mod.features.model, Model.schema)).toEqual({});
  });
});
