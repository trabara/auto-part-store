import { z } from "zod";
import {
  DEFAULT_RELATION_DISPLAY_FIELD,
  ModuleDefinitionError,
  defineModule,
  flattenModuleRoutes,
  getRouteChain,
  getRoutePath,
  joinPaths,
  matchRoute,
  resolveRelation,
} from "./module";

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

// Schema with no "name" field, to exercise displayField validation.
const TagSchema = z.object({
  id: z.string(),
  label: z.string(),
});

/** Standard module used by most tests. */
function buildDashboard() {
  return defineModule({
    name: "DASHBOARD",
    path: "dashboard",
    features: (m) => ({
      company: m.feature({
        entity: CompanySchema,
        routes: (c) => [
          c.route({
            path: "companies",
            dto: CompanySchema,
          }),
        ],
      }),
      user: m.feature({
        entity: UserSchema,
        relations: {
          company: { targetEntity: "company", displayField: "name" },
        },
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

  it("keeps entity and relations on the feature", () => {
    const mod = buildDashboard();
    expect(mod.features.user.entity).toBe(UserSchema);
    expect(mod.features.user.relations).toEqual({
      company: { targetEntity: "company", displayField: "name" },
    });
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
            entity: CompanySchema,
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
          entity: CompanySchema,
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
          entity: CompanySchema,
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
    it("accepts a valid sibling relation", () => {
      expect(buildDashboard).not.toThrow();
    });

    it("rejects a relation field missing from the entity schema", () => {
      expect(
        withFeatures((m) => ({
          company: m.feature({ entity: CompanySchema, routes: () => [] }),
          user: m.feature({
            entity: UserSchema,
            relations: {
              ghost: { targetEntity: "company" },
            } as never,
            routes: () => [],
          }),
        })),
      ).toThrow(/field "ghost" does not exist on the entity schema/);
    });

    it("rejects an unknown targetEntity and lists known features", () => {
      expect(
        withFeatures((m) => ({
          user: m.feature({
            entity: UserSchema,
            relations: { company: { targetEntity: "ghost" } },
            routes: () => [],
          }),
        })),
      ).toThrow(/targetEntity "ghost".*known: user/);
    });

    it("skips target validation for external relations", () => {
      expect(
        withFeatures((m) => ({
          user: m.feature({
            entity: UserSchema,
            relations: {
              company: { targetEntity: "other-module-company", external: true },
            },
            routes: () => [],
          }),
        })),
      ).not.toThrow();
    });

    it("rejects a displayField missing from the target schema", () => {
      expect(
        withFeatures((m) => ({
          company: m.feature({ entity: CompanySchema, routes: () => [] }),
          user: m.feature({
            entity: UserSchema,
            relations: {
              company: { targetEntity: "company", displayField: "Company" },
            },
            routes: () => [],
          }),
        })),
      ).toThrow(/displayField "Company" does not exist on "company"/);
    });

    it(`validates the default displayField ("${DEFAULT_RELATION_DISPLAY_FIELD}") when omitted`, () => {
      expect(
        withFeatures((m) => ({
          tag: m.feature({ entity: TagSchema, routes: () => [] }),
          user: m.feature({
            entity: UserSchema,
            // UserSchema.company -> "tag" (which has no "name")
            relations: { company: { targetEntity: "tag" } },
            routes: () => [],
          }),
        })),
      ).toThrow(/displayField "name" does not exist on "tag"/);
    });

    it("rejects a fields entry missing from the target schema", () => {
      expect(
        withFeatures((m) => ({
          company: m.feature({ entity: CompanySchema, routes: () => [] }),
          user: m.feature({
            entity: UserSchema,
            relations: {
              company: { targetEntity: "company", fields: ["id", "nope"] },
            },
            routes: () => [],
          }),
        })),
      ).toThrow(/fields entry "nope"/);
    });

    it("skips shape checks for non-object schemas", () => {
      expect(
        withFeatures((m) => ({
          s: m.feature({
            entity: z.string(),
            relations: {
              anything: { targetEntity: "x", external: true },
            } as never,
            routes: () => [],
          }),
        })),
      ).not.toThrow();
    });
  });

  describe("duplicate paths", () => {
    it("rejects duplicate sibling routes", () => {
      expect(
        withFeatures((m) => ({
          f: m.feature({
            entity: CompanySchema,
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
            entity: CompanySchema,
            routes: (f) => [f.route({ path: "x", dto: CompanySchema })],
          }),
          b: m.feature({
            entity: CompanySchema,
            routes: (f) => [f.route({ path: "x", dto: CompanySchema })],
          }),
        })),
      ).toThrow(/Duplicate route path "\/v\/x" \(a:x and b:x\)/);
    });

    it("rejects duplicates between a nested route and a sibling chain", () => {
      expect(
        withFeatures((m) => ({
          f: m.feature({
            entity: CompanySchema,
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
            entity: CompanySchema,
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
            entity: CompanySchema,
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
            entity: CompanySchema,
            routes: (f) => [f.route({ path: "", dto: CompanySchema })],
          }),
          b: m.feature({
            entity: CompanySchema,
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
 * Relations helper
 * ========================================================================== */

describe("resolveRelation", () => {
  it('defaults displayField to "name"', () => {
    expect(resolveRelation({ targetEntity: "company" }).displayField).toBe(
      "name",
    );
  });

  it("keeps an explicit displayField and other options", () => {
    const rel = resolveRelation({
      targetEntity: "company",
      displayField: "label",
      type: "belongsTo",
      fields: ["id"],
    });
    expect(rel).toEqual({
      targetEntity: "company",
      displayField: "label",
      type: "belongsTo",
      fields: ["id"],
    });
  });

  it("does not mutate its input", () => {
    const input = { targetEntity: "company" };
    resolveRelation(input);
    expect(input).toEqual({ targetEntity: "company" });
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
