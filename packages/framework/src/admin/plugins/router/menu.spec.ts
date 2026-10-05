import { expandMenuItems, wrapMenuItems } from "./menu"
import { medusaRouterExt } from "./index"

// Shape of `virtual:medusa/menu-items` (app routes).
const VIRTUAL = `import { config as RouteConfig0 } from "/app/src/admin/routes/a/page.tsx"
import { config as RouteConfig1 } from "/app/src/admin/routes/a/[*]/page.tsx"
export default {
  menuItems: [
    {
      label: RouteConfig0.label,
      icon: undefined,
      path: "/a",
      nested: undefined,
      rank: undefined,
      translationNs: undefined
    },
    {
      label: RouteConfig1.label,
      icon: undefined,
      path: "/a/*",
      nested: undefined,
      rank: undefined,
      translationNs: undefined
    }
  ]
}`

// Shape of a prebuilt plugin admin bundle (`.medusa/server/src/admin/index.mjs`).
const PLUGIN = `const routeModule = { routes: [{ Component: X, path: "/a/*" }] };
const menuItemModule = {
  menuItems: [
    {
      label: config.label,
      icon: void 0,
      path: "/a",
      nested: void 0,
      rank: void 0,
      translationNs: void 0
    }
  ]
};
const plugin = { routeModule, menuItemModule };`

describe("wrapMenuItems", () => {
  it("wraps the generated array and forwards each config's items", () => {
    const { code, wrapped } = wrapMenuItems(VIRTUAL)
    expect(wrapped).toBe(1)
    expect(code).toContain("menuItems: __expandMenuItems([")
    expect(code).toContain("__items: RouteConfig0.items,")
    expect(code).toContain("__items: RouteConfig1.items,")
  })

  it("handles the plugin bundle shape without touching other modules", () => {
    const { code, wrapped } = wrapMenuItems(PLUGIN)
    expect(wrapped).toBe(1)
    expect(code).toContain("__items: config.items,")
    expect(code).toContain('const routeModule = { routes: [{ Component: X, path: "/a/*" }] };')
    expect(code).toContain("const plugin = { routeModule, menuItemModule };")
  })

  it("leaves code without menu items unchanged", () => {
    expect(wrapMenuItems("export default { routes: [] }")).toEqual({
      code: "export default { routes: [] }",
      wrapped: 0,
    })
  })

  it("produces code that evaluates to the expanded menu", () => {
    const { code } = wrapMenuItems(PLUGIN)
    const evaluate = new Function(
      "config",
      "X",
      "__expandMenuItems",
      `${code}; return menuItemModule.menuItems;`,
    )
    const config = { label: "A", items: [{ label: "Things", path: "/a/things", rank: 0 }] }
    expect(evaluate(config, null, expandMenuItems).map((i: any) => i.path)).toEqual([
      "/a",
      "/a/things",
    ])
  })
})

describe("expandMenuItems", () => {
  it("replaces a splat entry by its items and keeps a normal entry before them", () => {
    const result = expandMenuItems([
      { label: "A", path: "/a" },
      {
        label: "A",
        path: "/a/*",
        translationNs: "ns",
        __items: [
          { label: "One", path: "/a/one", rank: 0 },
          { label: "Two", path: "/a/two", rank: 1 },
        ],
      },
      { label: "B", path: "/b", __items: [{ label: "Sub", path: "/b/sub" }] },
    ])
    expect(result.map((i) => i.path)).toEqual(["/a", "/a/one", "/a/two", "/b", "/b/sub"])
    expect(result[1]).toMatchObject({ label: "One", translationNs: "ns", rank: 0 })
    expect(result.some((i) => "__items" in i)).toBe(false)
  })
})

describe("medusaRouterExt transform", () => {
  const plugin = medusaRouterExt()

  it("expands menus in prebuilt plugin admin bundles", () => {
    const out = plugin.transform(PLUGIN, "/repo/packages/plugins/x/.medusa/server/src/admin/index.mjs?v=1")
    expect(out?.code).toContain('import { expandMenuItems as __expandMenuItems } from "virtual:medusa-router-ext/runtime"')
    expect(out?.code).toContain("menuItems: __expandMenuItems([")
  })

  it("expands the app's virtual menu module", () => {
    const out = plugin.transform(VIRTUAL, "\0virtual:medusa/menu-items")
    expect(out?.code).toContain("__items: RouteConfig1.items,")
  })

  it("ignores other modules", () => {
    expect(plugin.transform(PLUGIN, "/repo/src/other.mjs")).toBeNull()
  })

  it("ships expandMenuItems in the runtime module", () => {
    const runtime = plugin.load("\0virtual:medusa-router-ext/runtime") as string
    expect(runtime).toMatch(/export function expandMenuItems\(/)
  })
})
