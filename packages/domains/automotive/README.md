# @repo/domain-automotive

Automotive domain: a Medusa plugin over the `vehicle`, `fitment` and `parts` modules, for auto-parts businesses. Apps run it with `composeApplication({ domains: [automotiveDomain] })` (`@repo/domain-automotive/manifest`), which registers the modules too.

| Folder | Contents |
|---|---|
| `src/manifest.ts` | the domain and the modules it needs |
| `src/api/admin` | route files mounting each module's admin API, and fitment conditions |
| `src/api/store` | storefront: vehicle selector, parts for a vehicle, part number search, garage |
| `src/admin` | pages mounting each module's admin, widgets (variant fitments and part numbers, customer garage), merged translations, `setup.ts` |
| `src/links` | links between modules and Medusa products, variants, customers |
| `src/conditions` | the vehicle catalog fitment conditions test (registered by `src/workflows/hooks/condition-attributes.ts` and `src/admin/setup.ts`) |
| `src/workflows` | cross-module workflows (`replaceFitmentConditions`, `removeOrphans`) and hooks (`hooks/`: brand option sync, vehicle cascade) |
| `src/queries` | cross-module reads (`FitmentSearch`, store product cards, parts for a vehicle) |
| `src/subscribers`, `src/scripts` | cleanup when Medusa records are deleted |

Integration tests (`yarn workspace @repo/domain-automotive test:integration:http`) boot this plugin with its modules loaded from source (`medusa-config.ts`).
