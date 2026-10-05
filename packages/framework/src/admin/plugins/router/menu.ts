/**
 * Sidebar expansion for Medusa's generated menu items.
 *
 * Medusa builds the sidebar from page `config` exports and drops entries whose
 * path is a splat (`/x/*`). A page config may declare `items` (see
 * `RouteConfig.items`); the router extension wraps the generated `menuItems`
 * array with `expandMenuItems`, which emits one entry per item — nested under
 * the parent by the dashboard because their paths share its prefix.
 */

export type GeneratedMenuItem = {
  label: unknown;
  path: string;
  icon?: unknown;
  nested?: string;
  rank?: number;
  translationNs?: unknown;
  __items?: { label: string; path: string; icon?: unknown; rank?: number }[];
};

/** Runtime: replaces items carrying `__items` by their entries (splats are dropped). */
export function expandMenuItems(items: GeneratedMenuItem[]): GeneratedMenuItem[] {
  return items.flatMap((item) => {
    const { __items, ...rest } = item;
    if (!__items || __items.length === 0) return [rest];
    const children = __items.map((child) => ({
      label: child.label,
      path: child.path,
      icon: child.icon,
      nested: undefined,
      rank: child.rank,
      translationNs: rest.translationNs,
    }));
    return rest.path.endsWith("/*") ? children : [rest, ...children];
  });
}

/** Index of the bracket closing the one at `open` (string literals skipped). */
function matchingBracket(code: string, open: number): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = open; i < code.length; i++) {
    const c = code[i]!;
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "[") depth++;
    else if (c === "]" && --depth === 0) return i;
  }
  return -1;
}

/**
 * Build time: wraps each generated `menuItems: [...]` array with
 * `__expandMenuItems(...)` and forwards each config's `items` as `__items`.
 * Returns the code unchanged when it has no menu items.
 */
export function wrapMenuItems(code: string, helper = "__expandMenuItems"): { code: string; wrapped: number } {
  let out = "";
  let cursor = 0;
  let wrapped = 0;
  const marker = /menuItems:\s*\[/g;
  let match: RegExpExecArray | null;
  while ((match = marker.exec(code))) {
    const open = match.index + match[0].length - 1;
    const close = matchingBracket(code, open);
    if (close === -1) break;
    const body = code
      .slice(open, close + 1)
      .replace(/label:\s*([A-Za-z_$][\w$]*)\.label,/g, "label: $1.label,\n    __items: $1.items,");
    out += code.slice(cursor, match.index) + `menuItems: ${helper}(${body})`;
    cursor = close + 1;
    marker.lastIndex = cursor;
    wrapped++;
  }
  return { code: wrapped ? out + code.slice(cursor) : code, wrapped };
}
