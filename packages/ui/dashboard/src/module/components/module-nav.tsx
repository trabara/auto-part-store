import { clx } from "@medusajs/ui";
import { startCase } from "lodash";
import { Link, useLocation } from "react-router-dom";
import { useModule } from "../context/module";
import { featurePath } from "../utils/routes";

/**
 * Links to each feature's list page, derived from the module definition.
 * Render inside `<Module>`, above `<ModuleRouter>`.
 */
export function ModuleNav() {
  const { module } = useModule();
  const { pathname } = useLocation();

  const links = Object.values(module.features)
    .map((feature) => ({ key: feature.key, to: featurePath(feature, "list") }))
    .filter((link): link is { key: string; to: string } => !!link.to);

  return (
    <nav className="mb-2 flex flex-wrap gap-1" aria-label={module.name}>
      {links.map(({ key, to }) => {
        const active = pathname === to || pathname.startsWith(`${to}/`);
        return (
          <Link
            key={key}
            to={to}
            className={clx(
              "txt-compact-small-plus rounded-md px-3 py-1.5 transition-colors",
              active
                ? "bg-ui-bg-base text-ui-fg-base shadow-elevation-card-rest"
                : "text-ui-fg-subtle hover:bg-ui-bg-base-hover hover:text-ui-fg-base",
            )}
          >
            {startCase(key)}
          </Link>
        );
      })}
    </nav>
  );
}
