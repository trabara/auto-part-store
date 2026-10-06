import {
  fillPath,
  findSlotRoute,
  getRoutePath,
  type CrudSlot,
  type FeatureDef,
  type ModuleDef,
  type RelationUi,
} from "@repo/framework/core";
import { useRouteScope } from "@repo/framework/admin";
import { getEntity, type EntityDef, type RelationDef } from "@repo/framework/entity";

type AnyEntity = EntityDef<any, any, any>;

/** The feature, entity and route currently rendering (inside `<ModuleRouter>`). */
export function useFeature() {
  const scope = useRouteScope();
  const feature = scope.feature as FeatureDef;
  return {
    scope,
    module: scope.module as ModuleDef,
    feature,
    entity: feature.entity as AnyEntity,
    route: scope.route,
  };
}

/** Admin API URL of an entity collection or item: `/admin/<module>/<entity>[/id]`. */
export function entityUrl(module: ModuleDef, entity: AnyEntity, id?: string): string {
  // External entities (Medusa models) are served by their own admin routes.
  const base =
    entity.external?.url ?? `/admin/${module.path.replace(/^\/|\/$/g, "")}/${entity.modelName}`;
  return id ? `${base}/${encodeURIComponent(id)}` : base;
}

/** Absolute admin-app path of a feature's CRUD slot (`/automotive/vehicles/42`). */
export function featurePath(
  feature: FeatureDef,
  slot: CrudSlot,
  params?: Record<string, string>,
): string | undefined {
  const route = findSlotRoute(feature, slot);
  return route ? fillPath(getRoutePath(route.scope), params) : undefined;
}

/** The module feature whose entity is `entityName`, if any. */
export function featureFor(module: ModuleDef, entityName: string): FeatureDef | undefined {
  return Object.values(module.features).find((f) => f.entity.name === entityName);
}

export type ResolvedRelation = {
  key: string;
  relation: RelationDef;
  ui: RelationUi;
  label: string;
  /** Target feature, when the target is part of the module. */
  target?: FeatureDef;
  targetEntity?: AnyEntity;
};

/** Visible (non-hidden) relations of a feature, with their target features. */
function externalEntity(name: string): AnyEntity | undefined {
  const entity = getEntity(name);
  return entity?.external ? (entity as AnyEntity) : undefined;
}

export function featureRelations(module: ModuleDef, feature: FeatureDef): ResolvedRelation[] {
  const relations = feature.entity.relations as Record<string, RelationDef>;
  const ui = feature.relations as Record<string, RelationUi>;
  return Object.entries(relations)
    .filter(([key]) => !ui[key]?.hidden)
    .map(([key, relation]) => {
      const target = featureFor(module, relation.target);
      return {
        key,
        relation,
        ui: ui[key] ?? {},
        label: ui[key]?.label ?? startCase(key),
        target,
        // Medusa-owned targets (external entities) have no feature, but can
        // still be picked and labelled.
        targetEntity: (target?.entity ?? externalEntity(relation.target)) as AnyEntity | undefined,
      };
    });
}

function startCase(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
