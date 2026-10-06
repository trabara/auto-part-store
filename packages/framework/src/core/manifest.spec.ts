import { defineModuleManifest, orderModules, validateModuleManifests } from "./manifest"

const vehicle = defineModuleManifest({ key: "vehicle" })
const fitment = defineModuleManifest({ key: "fitment", dependsOn: ["vehicle"] })
const parts = defineModuleManifest({ key: "parts" })

describe("module manifests", () => {
  it("are frozen data with a dependsOn list", () => {
    expect(vehicle).toEqual({ key: "vehicle", dependsOn: [] })
    expect(Object.isFrozen(fitment.dependsOn)).toBe(true)
  })

  it("validate keys and dependencies", () => {
    expect(validateModuleManifests([vehicle, fitment, parts])).toEqual([])
    expect(validateModuleManifests([fitment])).toEqual(['Module "fitment" depends on "vehicle", which is not registered.'])
    expect(validateModuleManifests([vehicle, vehicle])).toEqual(['Module "vehicle" is declared twice.'])
    expect(validateModuleManifests([defineModuleManifest({ key: "a", dependsOn: ["a"] })])).toEqual([
      'Module "a" depends on itself.',
    ])
  })

  it("detect cycles", () => {
    const a = defineModuleManifest({ key: "a", dependsOn: ["b"] })
    const b = defineModuleManifest({ key: "b", dependsOn: ["c"] })
    const c = defineModuleManifest({ key: "c", dependsOn: ["a"] })
    expect(validateModuleManifests([a, b, c])).toEqual(["Module dependency cycle: a → b → c → a."])
  })

  it("order dependencies first, and refuse invalid sets", () => {
    expect(orderModules([fitment, parts, vehicle]).map((m) => m.key)).toEqual(["vehicle", "fitment", "parts"])
    expect(() => orderModules([fitment])).toThrow(/not registered/)
  })
})
