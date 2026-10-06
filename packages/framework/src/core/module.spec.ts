import { z } from "@medusajs/framework/zod";
import { defineEntities, defineEntity, type EntityDef } from "../entity";
import {
  ModuleDefinitionError,
  defineModule,
  fillPath,
  findSlotRoute,
  flattenModuleRoutes,
  getRouteChain,
  getRoutePath,
  joinPaths,
  matchRoute,
  sidebarItems,
  translatedMenu,
} from "./module";

declare module "../entity" {
  interface EntityRegistry {
    Company: EntityDef;
    Team: EntityDef;
    Member: EntityDef;
    User: EntityDef;
    Make: EntityDef;
    Model: EntityDef;
    FitmentCategory: EntityDef;
    SideMake: EntityDef;
    SideThing: EntityDef;
  }
}

/* ==========================================================================
 * Fixtures
 * ========================================================================== */

const CompanySchema = z.object({
  id: z.string(),
  name: z.string(),
});

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  company: CompanySchema,
});

const Company = defineEntity("Company", { schema: CompanySchema });

const User = defineEntity("User", {
  schema: UserSchema.omit({ company: true }),
  relations: (r) => ({ company: r.belongsTo("Company") }),
});

/** Standard module used by most tests. */
function buildDashboard() {
  return defineModule({
    name: "DASHBOARD",
    path: "dashboard",
    features: (m) => ({
      company: m.feature({
        entity: Company,
        routes: (c) => [
          c.route({
            path: "companies",
            dto: CompanySchema,
          }),
        ],
      }),
      user: m.feature({
        entity: User,
        routes: (u) => [
          u.route({
            path: "users",
            dto: UserSchema.omit({ company: true }),
            children: (list) => [
              list.route({
                path: "new",
                dto: UserSchema,
              }),
              list.route({
                path: ":id",
                dto: UserSchema,
              }),
            ],
          }),
        ],
      }),
    }),
  });
}

/* ==========================================================================
 * defineModule: structure
 * ========================================================================== */

describe("defineModule: structure", () => {
  it("returns name, path and features", () => {
    const mod = buildDashboard();
    expect(mod.name).toBe("DASHBOARD");
    expect(mod.path).toBe("dashboard");
    expect(Object.keys(mod.features)).toEqual(["company", "user"]);
  });

  it("assigns each feature its key", () => {
    const mod = buildDashboard();
    expect(mod.features.company.key).toBe("company");
    expect(mod.features.user.key).toBe("user");
  });

  it("keeps the entity, relation UI and options on the feature", () => {
    const mod = buildDashboard();
    expect(mod.features.user.entity).toBe(User);
    expect(mod.features.user.relations).toEqual({});
    expect(mod.features.user.ui).toEqual({});
  });

  it("throws when the module name is empty", () => {
    expect(() =>
      defineModule({ name: "", path: "x", features: () => ({}) }),
    ).toThrow(ModuleDefinitionError);
  });

  it("allows a module with no features", () => {
    const mod = defineModule({
      name: "EMPTY",
      path: "empty",
      features: () => ({}),
    });
    expect(mod.features).toEqual({});
  });

  it("throws when a route path is not a string", () => {
    expect(() =>
      defineModule({
        name: "BAD",
        path: "bad",
        features: (m) => ({
          f: m.feature({
            entity: Company,
            routes: (f) => [
              f.route({
                path: 42 as unknown as string,
                dto: CompanySchema,
              }),
            ],
          }),
        }),
      }),
    ).toThrow(/Route path must be a string/);
  });
});

/* ==========================================================================
 * Routes and scopes
 * ========================================================================== */

describe("routes and scopes", () => {
  it("defaults children to an empty array", () => {
    const mod = buildDashboard();
    const [companies] = mod.features.company.routes;
    expect(companies.children).toEqual([]);
  });

  it("builds top-level scope with module, feature, route and no parent", () => {
    const mod = buildDashboard();
    const [users] = mod.features.user.routes;
    expect(users.scope.module).toBe(mod);
    expect(users.scope.feature).toBe(mod.features.user);
    expect(users.scope.route).toBe(users);
    expect(users.scope.parent).toBeUndefined();
  });

  it("nests children and links them to the parent scope", () => {
    const mod = buildDashboard();
    const [users] = mod.features.user.routes;

    expect(users.children).toHaveLength(2);
    const [newRoute, byId] = users.children;

    expect(newRoute!.path).toBe("new");
    expect(byId!.path).toBe(":id");
    expect(byId!.scope.parent).toBe(users.scope);
    expect(byId!.scope.feature).toBe(mod.features.user);
    expect(byId!.scope.module).toBe(mod);
  });

  it("supports arbitrary nesting depth", () => {
    const mod = defineModule({
      name: "DEEP",
      path: "deep",
      features: (m) => ({
        f: m.feature({
          entity: Company,
          routes: (f) => [
            f.route({
              path: "a",
              dto: CompanySchema,

              children: (a) => [
                a.route({
                  path: "b",
                  dto: CompanySchema,

                  children: (b) => [b.route({ path: "c", dto: CompanySchema })],
                }),
              ],
            }),
          ],
        }),
      }),
    });

    const c = mod.features.f.routes[0]!.children[0]!.children[0]!;
    expect(getRoutePath(c.scope)).toBe("/deep/a/b/c");
    expect(getRouteChain(c.scope).map((r) => r.path)).toEqual(["a", "b", "c"]);
  });

  it("gives the children callback a builder whose scope is the parent route", () => {
    let captured: unknown;
    const mod = defineModule({
      name: "M",
      path: "m",
      features: (m) => ({
        f: m.feature({
          entity: Company,
          routes: (f) => [
            f.route({
              path: "p",
              dto: CompanySchema,

              children: (builder) => {
                captured = builder.scope;
                return [];
              },
            }),
          ],
        }),
      }),
    });

    const parent = mod.features.f.routes[0]!;
    expect(captured).toBe(parent.scope);
    expect((captured as { route: unknown }).route).toBe(parent);
  });

  it("stores the dto schema per route", () => {
    const mod = buildDashboard();
    const [users] = mod.features.user.routes;
    expect(users.dto).not.toBe(UserSchema); // the omit()'ed schema
    expect(users.children[1]!.dto).toBe(UserSchema);
  });
});

/* ==========================================================================
 * Immutability
 * ========================================================================== */

describe("immutability", () => {
  it("deep-freezes module, features, routes, children and scopes", () => {
    const mod = buildDashboard();
    const users = mod.features.user.routes[0]!;

    expect(Object.isFrozen(mod)).toBe(true);
    expect(Object.isFrozen(mod.features)).toBe(true);
    expect(Object.isFrozen(mod.features.user)).toBe(true);
    expect(Object.isFrozen(mod.features.user.routes)).toBe(true);
    expect(Object.isFrozen(mod.features.user.relations)).toBe(true);
    expect(Object.isFrozen(users)).toBe(true);
    expect(Object.isFrozen(users.children)).toBe(true);
    expect(Object.isFrozen(users.children[0])).toBe(true);
    expect(Object.isFrozen(users.scope)).toBe(true);
  });

  it("rejects mutation (strict mode)", () => {
    const mod = buildDashboard();
    expect(() => {
      (mod as { name: string }).name = "x";
    }).toThrow(TypeError);
    expect(() => {
      (mod.features.user.routes as unknown as unknown[]).push({});
    }).toThrow(TypeError);
  });
});

/* ==========================================================================
 * Validation
 * ========================================================================== */

describe("validation", () => {
  const withFeatures =
    (
      build: (
        m: Parameters<Parameters<typeof defineModule>[0]["features"]>[0],
      ) => Record<string, any>,
    ) =>
    () =>
      defineModule({
        name: "V",
        path: "v",
        features: (m) => build(m),
      });

  describe("relations", () => {
    it("accepts relations whose target is a feature of the module", () => {
      expect(() => buildDashboard()).not.toThrow();
    });

    it("rejects a relation whose target is not a feature", () => {
      expect(
        withFeatures((m) => ({
          user: m.feature({ entity: User, routes: () => [] }),
        })),
      ).toThrow(/relation "company": target "Company" is not a feature of module "V"/);
    });

    it("accepts hidden or external relations to non-features", () => {
      expect(
        withFeatures((m) => ({
          user: m.feature({ entity: User, relations: { company: { hidden: true } }, routes: () => [] }),
        })),
      ).not.toThrow();
      expect(
        withFeatures((m) => ({
          user: m.feature({ entity: User, relations: { company: { external: true } }, routes: () => [] }),
        })),
      ).not.toThrow();
    });

    it("accepts targets served by another module's API (set with a path)", () => {
      const Team = defineEntity("Team", { schema: CompanySchema });
      defineEntities({ Team }, { path: "teams" });
      const Member = defineEntity("Member", {
        schema: CompanySchema,
        relations: (r) => ({ team: r.belongsTo("Team") }),
      });
      expect(
        withFeatures((m) => ({ member: m.feature({ entity: Member, routes: () => [] }) })),
      ).not.toThrow();
    });

    it("rejects UI config for a relation the entity does not have", () => {
      expect(
        withFeatures((m) => ({
          company: m.feature({
            entity: Company,
            relations: { nope: { label: "x" } } as any,
            routes: () => [],
          }),
        })),
      ).toThrow(/relations\.nope is not a relation of entity "Company"/);
    });
  });

  describe("duplicate paths", () => {
    it("rejects duplicate sibling routes", () => {
      expect(
        withFeatures((m) => ({
          f: m.feature({
            entity: Company,
            routes: (f) => [
              f.route({ path: "same", dto: CompanySchema }),
              f.route({ path: "same", dto: CompanySchema }),
            ],
          }),
        })),
      ).toThrow(/Duplicate route path "\/v\/same"/);
    });

    it("rejects duplicates across features", () => {
      expect(
        withFeatures((m) => ({
          a: m.feature({
            entity: Company,
            routes: (f) => [f.route({ path: "x", dto: CompanySchema })],
          }),
          b: m.feature({
            entity: Company,
            routes: (f) => [f.route({ path: "x", dto: CompanySchema })],
          }),
        })),
      ).toThrow(/Duplicate route path "\/v\/x" \(a:x and b:x\)/);
    });

    it("rejects duplicates between a nested route and a sibling chain", () => {
      expect(
        withFeatures((m) => ({
          f: m.feature({
            entity: Company,
            routes: (f) => [
              f.route({
                path: "a",
                dto: CompanySchema,

                children: (a) => [a.route({ path: "b", dto: CompanySchema })],
              }),
              f.route({ path: "a/b", dto: CompanySchema }),
            ],
          }),
        })),
      ).toThrow(/Duplicate route path "\/v\/a\/b"/);
    });

    it("allows the same child segment under different parents", () => {
      expect(
        withFeatures((m) => ({
          f: m.feature({
            entity: Company,
            routes: (f) => [
              f.route({
                path: "a",
                dto: CompanySchema,

                children: (a) => [a.route({ path: ":id", dto: CompanySchema })],
              }),
              f.route({
                path: "b",
                dto: CompanySchema,

                children: (b) => [b.route({ path: ":id", dto: CompanySchema })],
              }),
            ],
          }),
        })),
      ).not.toThrow();
    });

    it("allows a single index route (empty path)", () => {
      const mod = defineModule({
        name: "I",
        path: "i",
        features: (m) => ({
          f: m.feature({
            entity: Company,
            routes: (f) => [f.route({ path: "", dto: CompanySchema })],
          }),
        }),
      });
      expect(getRoutePath(mod.features.f.routes[0]!.scope)).toBe("/i");
    });

    it("rejects two index routes", () => {
      expect(
        withFeatures((m) => ({
          a: m.feature({
            entity: Company,
            routes: (f) => [f.route({ path: "", dto: CompanySchema })],
          }),
          b: m.feature({
            entity: Company,
            routes: (f) => [f.route({ path: "", dto: CompanySchema })],
          }),
        })),
      ).toThrow(/Duplicate route path "\/v"/);
    });
  });

  describe("ModuleDefinitionError", () => {
    it("has a stable name and prefix", () => {
      const err = new ModuleDefinitionError("boom");
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe("ModuleDefinitionError");
      expect(err.message).toBe("[defineModule] boom");
    });
  });
});

/* ==========================================================================
 * Path helpers
 * ========================================================================== */

describe("joinPaths", () => {
  it("joins segments with single slashes and a leading slash", () => {
    expect(joinPaths("a", "b", "c")).toBe("/a/b/c");
  });

  it("normalises leading, trailing and duplicate slashes", () => {
    expect(joinPaths("/a/", "//b", "c/")).toBe("/a/b/c");
  });

  it("splits segments that contain slashes", () => {
    expect(joinPaths("a/b", "c")).toBe("/a/b/c");
  });

  it("ignores empty segments", () => {
    expect(joinPaths("a", "", "b")).toBe("/a/b");
  });

  it('returns "/" for no input', () => {
    expect(joinPaths()).toBe("/");
    expect(joinPaths("", "/")).toBe("/");
  });
});

describe("getRouteChain / getRoutePath", () => {
  const mod = buildDashboard();
  const users = mod.features.user.routes[0]!;
  const byId = users.children[1]!;

  it("returns the chain from the top-level ancestor down", () => {
    expect(getRouteChain(byId.scope)).toEqual([users, byId]);
    expect(getRouteChain(users.scope)).toEqual([users]);
  });

  it("builds full paths including the module path", () => {
    expect(getRoutePath(users.scope)).toBe("/dashboard/users");
    expect(getRoutePath(byId.scope)).toBe("/dashboard/users/:id");
  });
});

/* ==========================================================================
 * Tree helpers
 * ========================================================================== */

describe("flattenModuleRoutes", () => {
  it("returns every route depth-first with feature info", () => {
    const mod = buildDashboard();
    const flat = flattenModuleRoutes(mod);

    expect(flat.map((f) => [f.featureKey, f.fullPath, f.depth])).toEqual([
      ["company", "/dashboard/companies", 0],
      ["user", "/dashboard/users", 0],
      ["user", "/dashboard/users/new", 1],
      ["user", "/dashboard/users/:id", 1],
    ]);
  });

  it("references the real route and feature objects", () => {
    const mod = buildDashboard();
    const flat = flattenModuleRoutes(mod);
    const users = flat.find((f) => f.fullPath === "/dashboard/users")!;
    expect(users.route).toBe(mod.features.user.routes[0]);
    expect(users.feature).toBe(mod.features.user);
  });

  it("returns an empty array for a module with no routes", () => {
    const mod = defineModule({ name: "E", path: "e", features: () => ({}) });
    expect(flattenModuleRoutes(mod)).toEqual([]);
  });
});

describe("matchRoute", () => {
  const mod = buildDashboard();

  it("matches a static route", () => {
    const match = matchRoute(mod, "/dashboard/users");
    expect(match?.flat.fullPath).toBe("/dashboard/users");
    expect(match?.params).toEqual({});
  });

  it("captures params", () => {
    const match = matchRoute(mod, "/dashboard/users/42");
    expect(match?.flat.fullPath).toBe("/dashboard/users/:id");
    expect(match?.params).toEqual({ id: "42" });
  });

  it("prefers static segments over dynamic ones", () => {
    const match = matchRoute(mod, "/dashboard/users/new");
    expect(match?.flat.fullPath).toBe("/dashboard/users/new");
    expect(match?.params).toEqual({});
  });

  it("decodes URI components in params", () => {
    expect(matchRoute(mod, "/dashboard/users/a%20b")?.params).toEqual({
      id: "a b",
    });
  });

  it("tolerates leading and trailing slashes", () => {
    expect(matchRoute(mod, "dashboard/users/")?.flat.fullPath).toBe(
      "/dashboard/users",
    );
  });

  it("returns null when nothing matches", () => {
    expect(matchRoute(mod, "/dashboard/nope")).toBeNull();
    expect(matchRoute(mod, "/other/users")).toBeNull();
    expect(matchRoute(mod, "/dashboard/users/1/extra")).toBeNull();
    expect(matchRoute(mod, "/")).toBeNull();
  });
});

describe("matchRoute: splats", () => {
  const mod = defineModule({
    name: "S",
    path: "s",
    features: (m) => ({
      f: m.feature({
        entity: Company,
        routes: (f) => [
          f.route({ path: "docs/*", dto: CompanySchema }),
          f.route({ path: "docs/intro", dto: CompanySchema }),
        ],
      }),
    }),
  });

  it("captures the rest of the path", () => {
    const match = matchRoute(mod, "/s/docs/a/b%20c");
    expect(match?.flat.fullPath).toBe("/s/docs/*");
    expect(match?.params).toEqual({ "*": "a/b c" });
  });

  it("matches an empty rest", () => {
    expect(matchRoute(mod, "/s/docs")?.params).toEqual({ "*": "" });
  });

  it("loses to static routes", () => {
    expect(matchRoute(mod, "/s/docs/intro")?.flat.fullPath).toBe("/s/docs/intro");
  });
});

/* ==========================================================================
 * crud()
 * ========================================================================== */

describe("crud", () => {
  const Make = defineEntity("Make", {
    schema: z.object({ id: z.string(), name: z.string() }),
    relations: (r) => ({ models: r.hasMany("Model", { mappedBy: "make" }) }),
  });
  const Model = defineEntity("Model", {
    schema: z.object({ id: z.string(), name: z.string(), year: z.number().optional() }),
    relations: (r) => ({ make: r.belongsTo("Make", { mappedBy: "models" }) }),
  });

  const build = (options: Parameters<typeof defineModule>[0]["features"]) =>
    defineModule({ name: "CAT", path: "cat", features: options });

  it("generates list/create and detail/edit routes", () => {
    const mod = build((m) => ({ make: m.crud(Make), model: m.crud(Model) }));
    expect(
      flattenModuleRoutes(mod)
        .filter((f) => f.featureKey === "make")
        .map((f) => [f.fullPath, f.route.template, f.route.slot]),
    ).toEqual([
      ["/cat/makes", "list", "list"],
      ["/cat/makes/create", "create", "create"],
      ["/cat/makes/:id", "detail", "detail"],
      ["/cat/makes/:id/edit", "edit", "edit"],
    ]);
  });

  it("uses the entity's schemas as route DTOs", () => {
    const mod = build((m) => ({ make: m.crud(Make), model: m.crud(Model) }));
    const f = mod.features.model;
    expect(findSlotRoute(f, "list")!.dto).toBe(Model.schema);
    expect(findSlotRoute(f, "create")!.dto).toBe(Model.dto.create);
    expect(findSlotRoute(f, "edit")!.dto).toBe(Model.dto.update);
    expect(Object.keys((findSlotRoute(f, "detail")!.dto as any).shape)).toContain("make");
  });

  it("kebab-cases the plural entity name by default", () => {
    const FitmentCategory = defineEntity("FitmentCategory", { schema: z.object({ id: z.string() }) });
    const mod = build((m) => ({ c: m.crud(FitmentCategory) }));
    expect(getRoutePath(findSlotRoute(mod.features.c, "list")!.scope)).toBe("/cat/fitment-categories");
  });

  it("accepts a custom path and template overrides", () => {
    const mod = build((m) => ({
      make: m.crud(Make, { path: "brands", templates: { detail: "make-detail" } }),
      model: m.crud(Model),
    }));
    const detail = findSlotRoute(mod.features.make, "detail")!;
    expect(getRoutePath(detail.scope)).toBe("/cat/brands/:id");
    expect(detail.template).toBe("make-detail");
  });

  it("validates relations like any feature", () => {
    expect(() => build((m) => ({ model: m.crud(Model) }))).toThrow(
      /relation "make": target "Make" is not a feature/,
    );
    expect(() =>
      build((m) => ({ model: m.crud(Model, { relations: { make: { hidden: true } } }) })),
    ).not.toThrow();
  });

  describe("wizard steps", () => {
    const withSteps = (steps: any) =>
      build((m) => ({ make: m.crud(Make), model: m.crud(Model, { steps }) }));

    it("stores valid steps on the feature", () => {
      const steps = [
        { id: "general", label: "General", fields: ["name", "make_id"] },
        { id: "extra", label: "Extra", fields: ["year"] },
      ];
      expect(withSteps(steps).features.model.ui.steps).toEqual(steps);
    });

    it("allows optional fields to be left out", () => {
      expect(() =>
        withSteps([{ id: "g", label: "G", fields: ["name", "make_id"] }]),
      ).not.toThrow();
    });

    it("rejects unknown, duplicated and missing required fields", () => {
      expect(() => withSteps([{ id: "g", label: "G", fields: ["name", "make_id", "nope"] }])).toThrow(
        /"nope" \(step "g"\) is not a create field/,
      );
      expect(() =>
        withSteps([
          { id: "a", label: "A", fields: ["name", "make_id"] },
          { id: "b", label: "B", fields: ["name"] },
        ]),
      ).toThrow(/"name" appears in more than one step/);
      expect(() => withSteps([{ id: "g", label: "G", fields: ["name"] }])).toThrow(
        /required field\(s\) "make_id" are in no step/,
      );
    });
  });
});

describe("fillPath", () => {
  it("fills and encodes params, leaving unknown ones", () => {
    expect(fillPath("/cat/makes/:id/edit", { id: "a b" })).toBe("/cat/makes/a%20b/edit");
    expect(fillPath("/cat/:x")).toBe("/cat/:x");
  });
});

describe("sidebarItems", () => {
  const Make = defineEntity("SideMake", { schema: z.object({ id: z.string(), name: z.string() }) });
  const Thing = defineEntity("SideThing", { schema: z.object({ id: z.string() }) });

  it("lists each feature's list route with its label, in order", () => {
    const mod = defineModule({
      name: "S",
      path: "shop",
      features: (m) => ({
        side_make: m.crud(Make, { label: "Brands" }),
        side_thing: m.crud(Thing),
        custom: m.feature({ entity: Thing, routes: (f) => [f.route({ path: "x", dto: Thing.schema })] }),
      }),
    });
    expect(sidebarItems(mod)).toEqual([
      { label: "Brands", path: "/shop/side-makes", rank: 0 },
      { label: "Side Things", path: "/shop/side-things", rank: 1 },
    ]);
    expect(translatedMenu(mod)).toEqual({
      label: "modules.shop.name",
      translationNs: "translation",
      items: [
        { label: "modules.shop.features.side_make", path: "/shop/side-makes", rank: 0 },
        { label: "modules.shop.features.side_thing", path: "/shop/side-things", rank: 1 },
      ],
    });
  });
});
