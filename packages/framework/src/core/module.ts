import { z } from "@medusajs/framework/zod";
import { kebabCase } from "lodash";
import type { EntityDef, RelationDef } from "../entity";
import { getEntityUrl } from "../entity/define-entity";
import { pluralize } from "../utils/strings";

/* ==========================================================================
 * Utility types
 * ========================================================================== */

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/**
 * Erased aliases, used ONLY in generic constraints and defaults.
 *
 * Using `any` here avoids TypeScript trying to prove variance between
 * unrelated concrete schemas. Public APIs stay strongly typed because
 * concrete types are captured by the factories below.
 */
type AnySchema = z.ZodType<any>;
type AnyEntity = EntityDef<any, any, any>;
type AnyRoute = RouteDef<any>;
type AnyFeature = FeatureDef<any, any>;
type AnyModule = ModuleDef<any>;
type AnyRouteScope = RouteScope<any, any, any, any>;

/**
 * Constraint for a feature's route list. The `| readonly []` member nudges
 * TypeScript to infer a tuple (preserving per-route schema types) instead of
 * a widened array.
 */
type RouteList = readonly AnyRoute[] | readonly [];

/* ==========================================================================
 * Errors
 * ========================================================================== */

export class ModuleDefinitionError extends Error {
  constructor(message: string) {
    super(`[defineModule] ${message}`);
    this.name = "ModuleDefinitionError";
  }
}

/* ==========================================================================
 * Templates
 * ========================================================================== */

/**
 * Template ids a route can render. UI packages augment it with their
 * templates, which makes `template` required and checked:
 *
 * ```ts
 * declare module "@repo/framework/core" {
 *   interface TemplateRegistry { list: true; create: true }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TemplateRegistry {}

/** Registered template ids, or any string before the registry is augmented. */
export type TemplateId = [keyof TemplateRegistry] extends [never]
  ? string
  : keyof TemplateRegistry & string;

type TemplateField = [keyof TemplateRegistry] extends [never]
  ? { /** Template rendering this route. Defaults to `path`. */ template?: string }
  : { /** Template rendering this route. */ template: TemplateId };

/** Slots of a CRUD feature; each maps to a template id. */
export type CrudSlot = "list" | "create" | "detail" | "edit";

/* ==========================================================================
 * Feature UI options
 * ========================================================================== */

/** UI-only tweaks for one relation of a feature's entity. */
export interface RelationUi {
  label?: string;
  /** Do not render this relation (picker, column, detail section). */
  hidden?: boolean;
  /** The target is not a feature of this module (rendered read-only). */
  external?: boolean;
}

export type FeatureRelationsUi<E extends AnyEntity> = Partial<
  Record<keyof E["relations"] & string, RelationUi>
>;

/** One step of the create wizard: fields of the create DTO. */
export interface WizardStep {
  id: string;
  label: string;
  description?: string;
  fields: readonly string[];
}

export interface FeatureUi {
  /** Sidebar / heading label. Defaults to the entity's plural name. */
  readonly label?: string;
  /** Create wizard steps; a single form when omitted. */
  readonly steps?: readonly WizardStep[];
  /**
   * Per-field UI overrides, opaque to core (the dashboard types them as
   * `FeatureFieldOverrides`).
   */
  readonly overrides?: Readonly<Record<string, object>>;
  /** Extra panels on the detail page, below the record's own fields. */
  readonly sections?: readonly DetailSectionDef[];
}

/**
 * A detail-page panel contributed by a plugin. `render` returns a React
 * node (opaque to core); `refresh` refetches the record.
 */
export interface DetailSectionDef {
  readonly id: string;
  readonly render: (ctx: { record: Record<string, any>; refresh: () => void }) => unknown;
}

/* ==========================================================================
 * Definitions
 * ========================================================================== */

/**
 * Route scope: where a route sits in the tree.
 *
 * `parent` is undefined for top-level routes of a feature and points at the
 * parent route's scope for nested routes.
 */
export interface RouteScope<
  M extends AnyModule = AnyModule,
  F extends AnyFeature = AnyFeature,
  R extends AnyRoute = AnyRoute,
  Parent extends AnyRouteScope | undefined = AnyRouteScope | undefined,
> {
  readonly module: M;
  readonly feature: F;
  readonly route: R;
  readonly parent: Parent;
}

export interface RouteDef<S extends z.ZodType = AnySchema> {
  /** Path segment(s), relative to the parent route (or the module). */
  readonly path: string;

  /** Schema of the data this route's template receives. */
  readonly dto: S;

  /** Template rendering this route. */
  readonly template: TemplateId;

  /** CRUD slot when generated by `crud()`. */
  readonly slot?: CrudSlot;

  readonly children: readonly AnyRoute[];

  /** The scope this route was created in (includes the parent chain). */
  readonly scope: AnyRouteScope;
}

export interface FeatureDef<
  E extends AnyEntity = AnyEntity,
  Routes extends RouteList = readonly AnyRoute[],
> {
  /** Key of this feature in its module. Assigned by defineModule. */
  readonly key: string;

  readonly entity: E;

  readonly relations: FeatureRelationsUi<E>;

  readonly ui: FeatureUi;

  readonly routes: Routes;
}

export type FeatureMap = Record<string, AnyFeature>;

export interface ModuleDef<Features extends FeatureMap = FeatureMap> {
  readonly name: string;

  readonly path: string;

  readonly features: Features;
}

/* ==========================================================================
 * Scopes and builders
 *
 * Builders deliberately do NOT mention the `Routes` / `Features` generics in
 * their parameter types. If they did, TypeScript would have to fix those
 * generics before seeing the callback's return value and would fall back to
 * the widened constraint.
 * ========================================================================== */

export interface ModuleScope<M extends AnyModule = AnyModule> {
  readonly module: M;
}

export interface FeatureScope<
  M extends AnyModule = AnyModule,
  F extends AnyFeature = AnyFeature,
> extends ModuleScope<M> {
  readonly feature: F;
}

/* ---- Route ------------------------------------------------------------- */

export type RouteConfig<
  M extends AnyModule,
  F extends AnyFeature,
  S extends z.ZodType,
  P extends AnyRouteScope | undefined,
> = TemplateField & {
  path: string;

  dto: S;

  /** Nested routes. The builder's `route` creates children of this route. */
  children?: (route: RouteBuilder<M, F, S, P>) => readonly AnyRoute[];
};

export type RouteFactory<
  M extends AnyModule,
  F extends AnyFeature,
  P extends AnyRouteScope | undefined,
> = <S extends z.ZodType>(config: RouteConfig<M, F, S, P>) => RouteDef<S>;

export interface RouteBuilder<
  M extends AnyModule,
  F extends AnyFeature,
  S extends z.ZodType,
  P extends AnyRouteScope | undefined,
> {
  /** Scope of the route being built. */
  readonly scope: RouteScope<M, F, RouteDef<S>, P>;

  /** Creates child routes whose `parent` is `scope`. */
  readonly route: RouteFactory<M, F, RouteScope<M, F, RouteDef<S>, P>>;
}

/* ---- Feature ----------------------------------------------------------- */

export interface FeatureConfig<
  M extends AnyModule,
  E extends AnyEntity,
  Routes extends RouteList,
> {
  entity: E;

  relations?: FeatureRelationsUi<E>;

  ui?: FeatureUi;

  routes: (feature: FeatureBuilder<M, E>) => Routes;
}

export interface FeatureBuilder<
  M extends AnyModule,
  E extends AnyEntity,
> extends FeatureScope<M, FeatureDef<E>> {
  /** Creates a top-level route belonging to this feature. */
  readonly route: RouteFactory<M, FeatureDef<E>, undefined>;
}

export type FeatureFactory<M extends AnyModule> = <
  E extends AnyEntity,
  const Routes extends RouteList,
>(
  config: FeatureConfig<M, E, Routes>,
) => FeatureDef<E, Routes>;

export interface CrudOptions<E extends AnyEntity> {
  /** Sidebar / heading label. Defaults to the entity's plural name. */
  label?: string;
  /** List path. Defaults to the kebab-cased plural of the entity name. */
  path?: string;
  /** Template per slot. Defaults to the slot name. */
  templates?: Partial<Record<CrudSlot, TemplateId>>;
  /** Create wizard steps (fields of `entity.dto.create`). */
  steps?: readonly (Omit<WizardStep, "fields"> & {
    fields: readonly (keyof E["dto"]["create"]["shape"] & string)[];
  })[];
  overrides?: FeatureUi["overrides"];
  sections?: FeatureUi["sections"];
  relations?: FeatureRelationsUi<E>;
}

export type CrudFactory = <E extends AnyEntity>(
  entity: E,
  options?: CrudOptions<E>,
) => FeatureDef<E>;

/* ---- Module ------------------------------------------------------------ */

export interface ModuleConfig<Features extends FeatureMap> {
  name: string;

  path: string;

  features: (module: ModuleBuilder) => Features;
}

export interface ModuleBuilder<
  M extends AnyModule = ModuleDef,
> extends ModuleScope<M> {
  /** Creates a feature belonging to this module. */
  readonly feature: FeatureFactory<M>;

  /**
   * Creates a CRUD feature: `{list}` (+ `create`) and `{list}/:id`
   * (+ `edit`), rendered by the list/create/detail/edit templates.
   */
  readonly crud: CrudFactory;
}

/* ==========================================================================
 * Route implementation
 * ========================================================================== */

function createRouteFactory<
  M extends AnyModule,
  F extends AnyFeature,
  P extends AnyRouteScope | undefined,
>(mod: M, feature: F, parent: P): RouteFactory<M, F, P> {
  return <S extends z.ZodType>(
    config: RouteConfig<M, F, S, P>,
  ): RouteDef<S> => {
    if (typeof config.path !== "string") {
      throw new ModuleDefinitionError(
        `Route path must be a string (got ${typeof config.path}).`,
      );
    }

    /**
     * The one deliberate type boundary.
     *
     * Callbacks are written against the narrow scope
     * RouteScope<M, F, RouteDef<S>, P>, while RouteDef stores them against
     * the wide RouteScope. Function parameters are contravariant under
     * strictFunctionTypes, so TypeScript rejects the assignment. It is safe
     * here because the scope we pass at call time is always the one built
     * below.
     */
    const route = {
      path: config.path,
      dto: config.dto,
      template: (config as { template?: string }).template || config.path,
      slot: (config as { slot?: CrudSlot }).slot,
      children: [] as readonly AnyRoute[],
      scope: undefined,
    } as unknown as Mutable<RouteDef<S>>;

    const scope = {
      module: mod,
      feature,
      route,
      parent,
    } as unknown as RouteScope<M, F, RouteDef<S>, P>;

    route.scope = scope as unknown as AnyRouteScope;

    if (config.children) {
      const builder: RouteBuilder<M, F, S, P> = {
        scope,
        route: createRouteFactory(mod, feature, scope),
      };
      route.children = config.children(builder);
    }

    return route;
  };
}

/* ==========================================================================
 * Feature implementation
 * ========================================================================== */

function createFeatureFactory<M extends AnyModule>(mod: M): FeatureFactory<M> {
  return <E extends AnyEntity, const Routes extends RouteList>(
    config: FeatureConfig<M, E, Routes>,
  ): FeatureDef<E, Routes> => {
    /**
     * The feature object exists before its routes so route scopes can point
     * at it. NOTE: while `config.routes` runs, `feature.routes` is empty and
     * `feature.key` is "". Do not read them eagerly inside the callback.
     */
    const feature = {
      key: "",
      entity: config.entity,
      relations: config.relations ?? {},
      ui: config.ui ?? {},
      routes: [] as unknown as Routes,
    } as Mutable<FeatureDef<E, Routes>>;

    const builder: FeatureBuilder<M, E> = {
      module: mod,
      feature: feature as unknown as FeatureDef<E>,
      route: createRouteFactory(
        mod,
        feature as unknown as FeatureDef<E>,
        undefined,
      ),
    };

    feature.routes = config.routes(builder);

    return feature;
  };
}

function isOptionalField(field: z.ZodTypeAny): boolean {
  return field.safeParse(undefined).success;
}

function validateSteps(entity: AnyEntity, steps: readonly WizardStep[]): void {
  const shape = entity.dto.create.shape as Record<string, z.ZodTypeAny>;
  const where = `crud(${entity.name}) steps`;
  const seen = new Set<string>();
  for (const step of steps) {
    for (const field of step.fields) {
      if (!(field in shape)) {
        throw new ModuleDefinitionError(
          `${where}: "${field}" (step "${step.id}") is not a create field.`,
        );
      }
      if (seen.has(field)) {
        throw new ModuleDefinitionError(`${where}: "${field}" appears in more than one step.`);
      }
      seen.add(field);
    }
  }
  const missing = Object.keys(shape).filter((k) => !seen.has(k) && !isOptionalField(shape[k]!));
  if (missing.length) {
    throw new ModuleDefinitionError(
      `${where}: required field(s) ${missing.map((m) => `"${m}"`).join(", ")} are in no step.`,
    );
  }
}

function createCrudFactory<M extends AnyModule>(mod: M): CrudFactory {
  const feature = createFeatureFactory(mod);
  return (entity, options = {}) => {
    if (options.steps) validateSteps(entity, options.steps);
    const list = options.path ?? kebabCase(pluralize(entity.name));
    const template = (slot: CrudSlot) => (options.templates?.[slot] ?? slot) as TemplateId;
    // `slot` is internal: it lets templates find sibling CRUD routes.
    const route = (r: any, config: Record<string, unknown>) => r.route(config);

    return feature({
      entity,
      relations: options.relations,
      ui: { label: options.label, steps: options.steps, overrides: options.overrides, sections: options.sections },
      routes: (f) => [
        route(f, {
          path: list,
          slot: "list",
          template: template("list"),
          dto: entity.schema,
          children: (r: any) => [
            route(r, {
              path: "create",
              slot: "create",
              template: template("create"),
              dto: entity.dto.create,
            }),
          ],
        }),
        route(f, {
          path: `${list}/:id`,
          slot: "detail",
          template: template("detail"),
          dto: entity.withRelations(),
          children: (r: any) => [
            route(r, {
              path: "edit",
              slot: "edit",
              template: template("edit"),
              dto: entity.dto.update,
            }),
          ],
        }),
      ],
    }) as FeatureDef<typeof entity>;
  };
}

/* ==========================================================================
 * Module implementation
 * ========================================================================== */

export function defineModule<const Features extends FeatureMap>(
  config: ModuleConfig<Features>,
): ModuleDef<Features> {
  if (!config.name) {
    throw new ModuleDefinitionError("Module name is required.");
  }

  /**
   * Module shell, created first so features and routes can reference it.
   * While `config.features` runs, `module.features` is empty.
   */
  const mod = {
    name: config.name,
    path: config.path,
    features: {} as Features,
  } as Mutable<ModuleDef<Features>>;

  const builder: ModuleBuilder = {
    module: mod as ModuleDef,
    feature: createFeatureFactory(mod as ModuleDef),
    crud: createCrudFactory(mod as ModuleDef),
  };

  const features = config.features(builder);

  for (const [key, feature] of Object.entries(features)) {
    (feature as Mutable<AnyFeature>).key = key;
  }

  mod.features = features;

  validateModule(mod);
  deepFreezeModule(mod);

  return mod;
}

/* ==========================================================================
 * Validation
 * ========================================================================== */

function validateModule(mod: AnyModule): void {
  const features = mod.features as FeatureMap;
  const featureEntities = new Set(Object.values(features).map((f) => f.entity.name));

  for (const [key, feature] of Object.entries(features)) {
    const relations = feature.entity.relations as Record<string, RelationDef>;
    const ui = feature.relations as Record<string, RelationUi>;

    for (const relKey of Object.keys(ui)) {
      if (!(relKey in relations)) {
        throw new ModuleDefinitionError(
          `Feature "${key}": relations.${relKey} is not a relation of entity "${feature.entity.name}".`,
        );
      }
    }

    for (const [relKey, rel] of Object.entries(relations)) {
      const relUi = ui[relKey] ?? {};
      if (relUi.hidden || relUi.external || featureEntities.has(rel.target)) continue;
      // Targets with their own API (Medusa-owned entities, entities of other
      // modules whose set declares a `path`) are picked from there.
      if (getEntityUrl(rel.target)) continue;
      throw new ModuleDefinitionError(
        `Feature "${key}", relation "${relKey}": target "${rel.target}" is not a feature of ` +
          `module "${mod.name}" and has no API path (defineEntities({ path })). Add a feature for it, or set ` +
          `\`relations: { ${relKey}: { hidden: true } }\` (or \`external: true\`).`,
      );
    }
  }

  const seen = new Map<string, string>();
  for (const flat of flattenModuleRoutes(mod)) {
    const label = `${flat.featureKey}:${flat.route.path || "(index)"}`;
    const existing = seen.get(flat.fullPath);
    if (existing) {
      throw new ModuleDefinitionError(
        `Duplicate route path "${flat.fullPath}" (${existing} and ${label}).`,
      );
    }
    seen.set(flat.fullPath, label);
  }
}

function deepFreezeModule(mod: AnyModule): void {
  const freezeRoute = (route: AnyRoute): void => {
    for (const child of route.children) freezeRoute(child);
    Object.freeze(route.children);
    Object.freeze(route.scope);
    Object.freeze(route);
  };

  for (const feature of Object.values(mod.features as FeatureMap)) {
    for (const route of feature.routes as readonly AnyRoute[]) {
      freezeRoute(route);
    }
    Object.freeze(feature.routes);
    Object.freeze(feature.relations);
    Object.freeze(feature.ui);
    Object.freeze(feature);
  }

  Object.freeze(mod.features);
  Object.freeze(mod);
}

/* ==========================================================================
 * Runtime helpers (paths, tree, matching)
 * ========================================================================== */

export function joinPaths(...segments: string[]): string {
  const parts = segments.flatMap((s) => s.split("/")).filter(Boolean);
  return "/" + parts.join("/");
}

/** Routes from the top-level ancestor down to (and including) the scope's route. */
export function getRouteChain(scope: AnyRouteScope): AnyRoute[] {
  const chain: AnyRoute[] = [];
  let current: AnyRouteScope | undefined = scope;
  while (current) {
    chain.unshift(current.route);
    current = current.parent;
  }
  return chain;
}

/** Full path, e.g. "/dashboard/users/:id". */
export function getRoutePath(scope: AnyRouteScope): string {
  return joinPaths(
    scope.module.path,
    ...getRouteChain(scope).map((r) => r.path),
  );
}

export interface FlatRoute {
  fullPath: string;
  route: AnyRoute;
  feature: AnyFeature;
  featureKey: string;
  depth: number;
}

export function flattenModuleRoutes(mod: AnyModule): FlatRoute[] {
  const out: FlatRoute[] = [];

  const visit = (
    route: AnyRoute,
    feature: AnyFeature,
    featureKey: string,
    depth: number,
  ): void => {
    out.push({
      fullPath: getRoutePath(route.scope),
      route,
      feature,
      featureKey,
      depth,
    });
    for (const child of route.children) {
      visit(child, feature, featureKey, depth + 1);
    }
  };

  for (const [key, feature] of Object.entries(mod.features as FeatureMap)) {
    for (const route of feature.routes as readonly AnyRoute[]) {
      visit(route, feature, key, 0);
    }
  }
  return out;
}

/** The route of a feature generated for a CRUD slot, if any. */
export function findSlotRoute(feature: AnyFeature, slot: CrudSlot): AnyRoute | undefined {
  const search = (routes: readonly AnyRoute[]): AnyRoute | undefined => {
    for (const route of routes) {
      if (route.slot === slot) return route;
      const found = search(route.children);
      if (found) return found;
    }
    return undefined;
  };
  return search(feature.routes as readonly AnyRoute[]);
}

/** Fills `:param` segments of a full path. */
export function fillPath(path: string, params: Record<string, string> = {}): string {
  return path.replace(/:([A-Za-z0-9_]+)/g, (segment, name: string) =>
    params[name] === undefined ? segment : encodeURIComponent(params[name]),
  );
}

export interface RouteMatch {
  flat: FlatRoute;
  params: Record<string, string>;
}

/**
 * Matches a pathname against a module's routes. ":name" segments capture
 * params and a trailing "*" captures the rest (as `params["*"]`). When several
 * routes match, static segments beat dynamic ones and splats lose to both.
 */
export function matchRoute(
  mod: AnyModule,
  pathname: string,
): RouteMatch | null {
  const target = pathname.split("/").filter(Boolean);
  let best: (RouteMatch & { cost: number }) | null = null;

  for (const flat of flattenModuleRoutes(mod)) {
    const pattern = flat.fullPath.split("/").filter(Boolean);
    const splat = pattern[pattern.length - 1] === "*";
    const fixed = splat ? pattern.slice(0, -1) : pattern;
    if (splat ? target.length < fixed.length : target.length !== fixed.length) continue;

    const params: Record<string, string> = {};
    let cost = splat ? 1000 : 0;
    let ok = true;

    for (let i = 0; i < fixed.length; i++) {
      const p = fixed[i]!;
      const t = target[i]!;
      if (p.startsWith(":")) {
        params[p.slice(1)] = decodeURIComponent(t);
        cost++;
      } else if (p !== t) {
        ok = false;
        break;
      }
    }
    if (ok && splat) {
      params["*"] = target.slice(fixed.length).map(decodeURIComponent).join("/");
    }

    if (ok && (!best || cost < best.cost)) {
      best = { flat, params, cost };
    }
  }

  return best ? { flat: best.flat, params: best.params } : null;
}

/** A sidebar entry for a module feature. */
export interface SidebarItem {
  label: string;
  /** Absolute admin path (e.g. "/automotive/vehicles"). */
  path: string;
  rank?: number;
}

function startCaseKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Display label of a feature: `ui.label`, else its entity's plural name ("Vehicle Engines"). */
export function featureLabel(feature: AnyFeature): string {
  return feature.ui.label ?? startCaseKey(pluralize(feature.entity.name));
}

/**
 * One sidebar entry per feature that has a list route, in declaration order.
 * Use as `defineRouteConfig({ label, items: sidebarItems(module) })` on the
 * module's catch-all page (expanded by `medusaRouterExt`).
 */
export function sidebarItems(mod: AnyModule): SidebarItem[] {
  return Object.values(mod.features as FeatureMap).flatMap((feature, rank) => {
    const list = findSlotRoute(feature, "list");
    return list ? [{ label: featureLabel(feature), path: getRoutePath(list.scope), rank }] : [];
  });
}
