import { z } from "zod";

/* ==========================================================================
 * Utility types
 * ========================================================================== */

type SchemaOutput<S extends z.ZodType> = z.output<S>;

type StringKeyOf<T> = Extract<keyof T, string>;

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/**
 * Erased aliases, used ONLY in generic constraints and defaults.
 *
 * Using `any` here avoids TypeScript trying to prove variance between
 * unrelated concrete Zod schemas. Public APIs stay strongly typed because
 * concrete types are captured by the factories below.
 */
type AnySchema = z.ZodType<any>;
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
 * Relations
 * ========================================================================== */

export interface RelationConfig {
  /**
   * Target entity key: a feature key in the same module
   * (e.g. "company"), unless `external` is true.
   */
  targetEntity: string;

  /**
   * Set when the target lives in another module. Skips the sibling-feature
   * validation performed by defineModule.
   */
  external?: boolean;

  /**
   * Field on the target entity used as the display label.
   * Defaults to "name" (see resolveRelation).
   */
  displayField?: string;

  /**
   * Fields to fetch for the relation. Defaults to all scalar fields.
   */
  fields?: string[];

  /**
   * Relationship cardinality. If omitted, inferred from schema/metadata.
   */
  type?: "belongsTo" | "hasMany";
}

export type ResolvedRelation = RelationConfig & {
  displayField: string;
};

export const DEFAULT_RELATION_DISPLAY_FIELD = "name";

export function resolveRelation(relation: RelationConfig): ResolvedRelation {
  return {
    ...relation,
    displayField: relation.displayField ?? DEFAULT_RELATION_DISPLAY_FIELD,
  };
}

export type FeatureRelations<S extends z.ZodType> = Partial<
  Record<StringKeyOf<SchemaOutput<S>>, RelationConfig>
>;

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

  /** Always present at runtime; defaults to the route path. */

  readonly children: readonly AnyRoute[];

  /** The scope this route was created in (includes the parent chain). */
  readonly scope: AnyRouteScope;
}

export interface FeatureDef<
  S extends z.ZodType = AnySchema,
  Routes extends RouteList = readonly AnyRoute[],
> {
  /** Key of this feature in its module. Assigned by defineModule. */
  readonly key: string;

  readonly entity: S;

  readonly relations?: FeatureRelations<S>;

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

export interface RouteConfig<
  M extends AnyModule,
  F extends AnyFeature,
  S extends z.ZodType,
  P extends AnyRouteScope | undefined,
> {
  path: string;

  dto: S;

  /** Nested routes. The builder's `route` creates children of this route. */
  children?: (route: RouteBuilder<M, F, S, P>) => readonly AnyRoute[];
}

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
  S extends z.ZodType,
  Routes extends RouteList,
> {
  entity: S;

  relations?: FeatureRelations<S>;

  routes: (feature: FeatureBuilder<M, S>) => Routes;
}

export interface FeatureBuilder<
  M extends AnyModule,
  S extends z.ZodType,
> extends FeatureScope<M, FeatureDef<S>> {
  /** Creates a top-level route belonging to this feature. */
  readonly route: RouteFactory<M, FeatureDef<S>, undefined>;
}

export type FeatureFactory<M extends AnyModule> = <
  S extends z.ZodType,
  const Routes extends RouteList,
>(
  config: FeatureConfig<M, S, Routes>,
) => FeatureDef<S, Routes>;

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
     * here because the scope we pass at call time (see getRouteTitle /
     * renderers) is always the one built below.
     */
    const route = {
      path: config.path,
      dto: config.dto,
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
  return <S extends z.ZodType, const Routes extends RouteList>(
    config: FeatureConfig<M, S, Routes>,
  ): FeatureDef<S, Routes> => {
    /**
     * The feature object exists before its routes so route scopes can point
     * at it. NOTE: while `config.routes` runs, `feature.routes` is empty and
     * `feature.key` is "". Do not read them eagerly inside the callback.
     */
    const feature = {
      key: "",
      entity: config.entity,
      relations: config.relations,
      routes: [] as unknown as Routes,
    } as Mutable<FeatureDef<S, Routes>>;

    const builder: FeatureBuilder<M, S> = {
      module: mod,
      feature: feature as unknown as FeatureDef<S>,
      route: createRouteFactory(
        mod,
        feature as unknown as FeatureDef<S>,
        undefined,
      ),
    };

    feature.routes = config.routes(builder);

    return feature;
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

function getShape(schema: unknown): Record<string, unknown> | undefined {
  const shape = (schema as { shape?: unknown } | undefined)?.shape;
  return shape && typeof shape === "object"
    ? (shape as Record<string, unknown>)
    : undefined;
}

function validateModule(mod: AnyModule): void {
  const features = mod.features as FeatureMap;

  for (const [key, feature] of Object.entries(features)) {
    const ownShape = getShape(feature.entity);

    for (const [field, relation] of Object.entries(
      (feature.relations ?? {}) as Record<string, RelationConfig>,
    )) {
      const where = `Feature "${key}", relation "${field}"`;

      if (ownShape && !(field in ownShape)) {
        throw new ModuleDefinitionError(
          `${where}: field "${field}" does not exist on the entity schema.`,
        );
      }

      if (relation.external) continue;

      const target = features[relation.targetEntity];
      if (!target) {
        throw new ModuleDefinitionError(
          `${where}: targetEntity "${relation.targetEntity}" is not a feature ` +
            `of module "${mod.name}" (known: ${Object.keys(features).join(", ")}). ` +
            `Set \`external: true\` if it lives in another module.`,
        );
      }

      const targetShape = getShape(target.entity);
      if (!targetShape) continue;

      const display = relation.displayField ?? DEFAULT_RELATION_DISPLAY_FIELD;
      if (!(display in targetShape)) {
        throw new ModuleDefinitionError(
          `${where}: displayField "${display}" does not exist on "${relation.targetEntity}".`,
        );
      }

      for (const f of relation.fields ?? []) {
        if (!(f in targetShape)) {
          throw new ModuleDefinitionError(
            `${where}: fields entry "${f}" does not exist on "${relation.targetEntity}".`,
          );
        }
      }
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
    if (feature.relations) Object.freeze(feature.relations);
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

export interface RouteMatch {
  flat: FlatRoute;
  params: Record<string, string>;
}

/**
 * Matches a pathname against a module's routes. ":name" segments capture
 * params. When several routes match, the one with the fewest params wins
 * (static segments beat dynamic ones).
 */
export function matchRoute(
  mod: AnyModule,
  pathname: string,
): RouteMatch | null {
  const target = pathname.split("/").filter(Boolean);
  let best: (RouteMatch & { dynamic: number }) | null = null;

  for (const flat of flattenModuleRoutes(mod)) {
    const pattern = flat.fullPath.split("/").filter(Boolean);
    if (pattern.length !== target.length) continue;

    const params: Record<string, string> = {};
    let dynamic = 0;
    let ok = true;

    for (let i = 0; i < pattern.length; i++) {
      const p = pattern[i]!;
      const t = target[i]!;
      if (p.startsWith(":")) {
        params[p.slice(1)] = decodeURIComponent(t);
        dynamic++;
      } else if (p !== t) {
        ok = false;
        break;
      }
    }

    if (ok && (!best || dynamic < best.dynamic)) {
      best = { flat, params, dynamic };
    }
  }

  return best ? { flat: best.flat, params: best.params } : null;
}
