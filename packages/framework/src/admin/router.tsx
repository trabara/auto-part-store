import {
  createContext,
  useContext,
  useMemo,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  Navigate,
  Outlet,
  useParams,
  useRoutes,
  type RouteObject,
} from "react-router-dom";
import type { ModuleDef, RouteDef, RouteScope, TemplateId } from "../core";

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

/** Components rendering each template id. */
export type RouteTemplates = Partial<
  Record<TemplateId, ComponentType<RouteRenderContext>>
>;

export type ModuleRouterProps = {
  module: AnyModule;
  /** Component per template id; each route renders `templates[route.template]`. */
  templates?: RouteTemplates;
  /** Renders one route; takes precedence over `templates`. */
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

function MissingTemplate({ route }: RouteRenderContext) {
  return (
    <div data-missing-template={route.template} style={{ padding: 16, color: "#b91c1c" }}>
      Missing template "{route.template}" for route "{route.path || "(index)"}".
    </div>
  );
}

const templateRender =
  (templates: RouteTemplates) => (ctx: RouteRenderContext) => {
    const Template = templates[ctx.route.template as TemplateId] ?? MissingTemplate;
    return <Template {...ctx} />;
  };

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
    if (route.path === "") {
      // Index routes cannot have children: use a pathless layout route whose
      // own element renders for the index and wraps the children's outlet.
      return hasChildren
        ? { element, children: [{ index: true, element: <></> }, ...route.children.map(toObject)] }
        : { index: true, element };
    }
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
  templates = {},
  render,
  notFound = null,
}: ModuleRouterProps) {
  const objects = useMemo(
    () => [
      ...buildRouteObjects(module, render ?? templateRender(templates)),
      { path: "*", element: <>{notFound}</> },
    ],
    [module, templates, render, notFound],
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

