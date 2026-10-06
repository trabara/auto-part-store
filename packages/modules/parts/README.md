# @repo/module-parts

Parts module (Medusa key `parts`): brands and part numbers (MPN, OE, competitor, former), normalized for search, with equivalents through shared numbers. No dependencies; brands link to Medusa product option values and part numbers to variants (column links).

| Entry | Contents |
|---|---|
| `@repo/module-parts` | the Medusa module: `PartsModuleService` (`findByNumber`, `equivalentVariantIds`), models, migrations |
| `/entities` | entity definitions, `normalizePartNumber` (isomorphic) |
| `/http` | generic admin API `/admin/parts/:entity` (`partsRoutes`, `PARTS_PATH`) |
| `/admin` | `partsAdmin` (path `parts`), `partsTranslations` (en, fr, ar) |
| `/manifest` | `partsManifest` |

Keeping a brand's shared "Brand" option value in sync is the domain's job (it spans the product module). After changing entities: `yarn workspace @repo/module-parts db:generate`.
