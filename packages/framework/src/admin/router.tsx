import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  Navigate,
  Outlet,
  useParams,
  useRoutes,
  type RouteObject,
} from "react-router-dom";
import type { ModuleDef, RouteDef, RouteScope } from "../core";

type AnyModule = ModuleDef<any>;
type AnyRoute = RouteDef<any>;
type AnyScope = RouteScope<any, any, any, any>;

/** What a template needs to know about the route it renders. */
export type RouteRenderContext = {
  scope: AnyScope;
  route: AnyRoute;
  /** Nested child route (create/edit drawers, etc.). Render it where it should appear. */
  outlet: ReactNode;
};

export type ModuleRouterProps = {
  module: AnyModule;
  /** Renders one route. Defaults to a placeholder showing the route path. */
  render?: (ctx: RouteRenderContext) => ReactNode;
  /** Rendered for URLs under the module that match no route. */
  notFound?: ReactNode;
};

const ScopeContext = createContext<AnyScope | null>(null);

/** Scope (module, feature, route, parent chain) of the route currently rendering. */
export function useRouteScope(): AnyScope {
  const s = useContext(ScopeContext);
  if (!s) throw new Error("useRouteScope must be used inside <ModuleRouter>");
  return s;
}

function RouteElement(props: {
  route: AnyRoute;
  render: NonNullable<ModuleRouterProps["render"]>;
  hasChildren: boolean;
}) {
  const { route, render, hasChildren } = props;
  const scope = route.scope as AnyScope;
  return (
    <ScopeContext.Provider value={scope}>
      {render({ scope, route, outlet: hasChildren ? <Outlet /> : null })}
    </ScopeContext.Provider>
  );
}

const defaultRender = ({ route, outlet }: RouteRenderContext) => (
  <div data-route={route.path}>
    <span>{route.path || "(index)"}</span>
    {outlet}
  </div>
);

const topLevelRoutes = (module: AnyModule): AnyRoute[] =>
  Object.values(
    module.features as Record<string, { routes: readonly AnyRoute[] }>,
  ).flatMap((f) => [...f.routes]);

/** Paths stay relative to the parent match (Medusa mounts us at "/<module.path>/*"). */
export function buildRouteObjects(
  module: AnyModule,
  render: NonNullable<ModuleRouterProps["render"]>,
): RouteObject[] {
  const toObject = (route: AnyRoute): RouteObject => {
    const hasChildren = route.children.length > 0;
    const element = (
      <RouteElement route={route} render={render} hasChildren={hasChildren} />
    );
    if (route.path === "") return { index: true, element };
    return {
      path: route.path,
      element,
      children: hasChildren ? route.children.map(toObject) : undefined,
    };
  };
  return topLevelRoutes(module).map(toObject);
}

export function ModuleRouter({
  module,
  render = defaultRender,
  notFound = null,
}: ModuleRouterProps) {
  const objects = useMemo(
    () => [
      ...buildRouteObjects(module, render),
      { path: "*", element: <>{notFound}</> },
    ],
    [module, render, notFound],
  );
  return useRoutes(objects);
}

/** For the module root page ("/<module.path>"): redirects to the first top-level static route. */
export function ModuleHome({ module }: { module: AnyModule }) {
  const first = topLevelRoutes(module).find(
    (r) => r.path && !r.path.includes(":") && !r.path.includes("*"),
  );
  return first ? <Navigate to={first.path} replace /> : null;
}

/** Convenience for templates: ":id" etc. from the URL. */
export const useRouteParams = () => useParams();
