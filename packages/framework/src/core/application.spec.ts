import { composeApplication, defineDomainManifest } from "./application"
import { defineModuleManifest } from "./manifest"

const vehicle = defineModuleManifest({ key: "vehicle", resolve: "@repo/module-vehicle" })
const fitment = defineModuleManifest({ key: "fitment", dependsOn: ["vehicle"], resolve: "@repo/module-fitment" })
const parts = defineModuleManifest({ key: "parts", resolve: "@repo/module-parts" })

describe("composeApplication", () => {
  it("registers each domain's modules once, dependencies first, and the domains as plugins", () => {
    const automotive = defineDomainManifest({ name: "automotive", resolve: "@repo/domain-automotive", modules: [fitment, parts, vehicle] })
    const fleet = defineDomainManifest({ name: "fleet", resolve: "@repo/domain-fleet", modules: [vehicle] })
    const app = composeApplication({ domains: [automotive, fleet], options: { parts: { brandOption: "Brand" } } })
    expect(app.moduleKeys).toEqual(["vehicle", "fitment", "parts"])
    expect(app.modules).toEqual([
      { resolve: "@repo/module-vehicle" },
      { resolve: "@repo/module-fitment" },
      { resolve: "@repo/module-parts", options: { brandOption: "Brand" } },
    ])
    expect(app.plugins).toEqual([
      { resolve: "@repo/domain-automotive", options: {} },
      { resolve: "@repo/domain-fleet", options: {} },
    ])
  })

  it("fails at boot on a missing dependency, a conflicting package or a duplicate domain", () => {
    const lonely = defineDomainManifest({ name: "x", resolve: "@repo/domain-x", modules: [fitment] })
    expect(() => composeApplication({ domains: [lonely] })).toThrow(/depends on "vehicle", which is not registered/)
    const fork = defineModuleManifest({ key: "vehicle", resolve: "@acme/vehicle" })
    expect(() => composeApplication({ modules: [vehicle, fork] })).toThrow(/resolves to both/)
    expect(() => composeApplication({ domains: [lonely, lonely], modules: [vehicle] })).toThrow(/declared twice/)
  })
})
