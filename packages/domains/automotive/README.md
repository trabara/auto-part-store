# @repo/domain-automotive

Automotive domain: a Medusa plugin over the `vehicle`, `fitment` and `parts` modules, for auto-parts businesses. Apps run it with `composeApplication({ domains: [automotiveDomain] })` (`@repo/domain-automotive/contract`), which registers the modules too. Layers: contract → core → adapters (see AGENTS.md).

| Folder | Layer | Contents |
|---|---|---|
| `src/contract` | iso | manifest (the domain and its modules), translations (domain messages + its modules', merged) |
| `src/core` | iso | `condition-attributes.ts`: the vehicle fields fitment conditions may test |
| `src/composition` | iso | `composeAutomotive()`: plugs the catalog and translations into fitment's ports (server: `workflows/hooks/composition.ts`; admin: `admin/setup.ts`) |
| `src/queries` | server | cross-module reads: `FitmentSearch`, store product cards, parts for a vehicle |
| `src/workflows` | server | cross-module writes (`replaceFitmentConditions`, `removeOrphans`); `hooks/`: brand option sync, vehicle cascade, composition |
| `src/links`, `src/subscribers`, `src/scripts` | server | module links; cleanup when Medusa records are deleted; `remove-orphans`, `refresh-condition-summaries` |
| `src/api` | server | handlers only: admin mounts of each module's API and fitment conditions; storefront (vehicle selector, parts for a vehicle, part number search, garage) |
| `src/admin` | admin | pages mounting each module's admin, widgets (variant fitments and part numbers, customer garage), hooks, setup |

Integration tests (`yarn workspace @repo/domain-automotive test:integration:http`) boot this plugin with its modules loaded from source (`medusa-config.ts`).
