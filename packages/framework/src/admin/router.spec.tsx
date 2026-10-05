import { z } from "@medusajs/framework/zod"
import { renderToString } from "react-dom/server"
import { MemoryRouter } from "react-router-dom"
import { defineModule } from "../core"
import { defineEntity, type EntityDef } from "../entity"
import { buildRouteObjects, ModuleRouter, type RouteRenderContext } from "./router"

declare module "../entity" {
  interface EntityRegistry {
    RouterThing: EntityDef
  }
}

const Thing = defineEntity("RouterThing", { schema: z.object({ id: z.string(), name: z.string() }) })

const mod = defineModule({
  name: "R",
  path: "r",
  features: (m) => ({
    home: m.feature({
      entity: Thing,
      routes: (f) => [
        f.route({
          path: "",
          template: "home",
          dto: Thing.schema,
          children: (r) => [r.route({ path: "create", template: "create", dto: Thing.schema })],
        }),
      ],
    }),
    thing: m.crud(Thing, { path: "things" }),
  }),
})

const Echo = ({ route, outlet }: RouteRenderContext) => (
  <section data-template={route.template}>
    {outlet}
  </section>
)

const render = (path: string, templates: Record<string, typeof Echo>) =>
  renderToString(
    <MemoryRouter initialEntries={[path]}>
      <ModuleRouter module={mod} templates={templates} notFound={<p>not found</p>} />
    </MemoryRouter>,
  )

describe("buildRouteObjects", () => {
  it("keeps the children of an index route (layout + index child)", () => {
    const [home] = buildRouteObjects(mod, () => null)
    expect(home!.index).toBeUndefined()
    expect(home!.children?.map((c) => c.index ?? c.path)).toEqual([true, "create"])
  })
})

describe("ModuleRouter", () => {
  const templates = { home: Echo, create: Echo, list: Echo, detail: Echo, edit: Echo }

  it("renders the route's template, nesting children through the outlet", () => {
    const html = render("/create", templates)
    expect(html).toContain('data-template="home"')
    expect(html).toContain('data-template="create"')
  })

  it("renders the index route itself", () => {
    expect(render("/", templates)).toContain('data-template="home"')
  })

  it("renders crud detail and edit", () => {
    const html = render("/things/42/edit", templates)
    expect(html).toContain('data-template="detail"')
    expect(html).toContain('data-template="edit"')
  })

  it("shows a visible error for a missing template", () => {
    expect(render("/things", { home: Echo })).toContain('data-missing-template="list"')
  })

  it("renders notFound for unknown paths", () => {
    expect(render("/nope/x", templates)).toContain("not found")
  })
})
