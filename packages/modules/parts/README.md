# @repo/module-parts

Parts module (Medusa key `parts`): brands and part numbers (MPN, OE, competitor, former), normalized for search, with equivalents through shared numbers. No dependencies; brands link to Medusa product option values and part numbers to variants (column links). Layers: contract → core → adapters (see AGENTS.md).

| Entry | Layer | Contents |
|---|---|---|
| `@repo/module-parts` | server | the Medusa module: `PartsModuleService` (`findByNumber`, `equivalentVariantIds`), models, migrations, `partsRoutes` (`/admin/parts/:entity`) |
| `/contract` | iso | `PARTS_MODULE`, `partsManifest`, entities (`Brand`, `PartNumber`), `normalizePartNumber`, `partsTranslations` |
| `/admin` | iso | `partsAdmin` (admin definition, path `parts`) |

Keeping a brand's shared "Brand" option value in sync is the domain's job (it spans the product module). After changing entities: `yarn workspace @repo/module-parts db:generate`.
