# @repo/module-fitment

Fitment module (Medusa key `fitment`): which product variant fits which vehicle (`Fitment`: position, quantity, production window) and under which conditions (condition groups on vehicle fields). Depends on `vehicle` (`Fitment.vehicle` is a column link; it imports `@repo/module-vehicle/contract` only). Layers: contract → core → adapters (see AGENTS.md).

| Entry | Layer | Contents |
|---|---|---|
| `@repo/module-fitment` | server | the Medusa module: `FitmentModuleService` (`replaceConditions`, `findMatching`, `refreshConditionSummaries`), models, migrations, `fitmentRoutes` (`/admin/fitments/:entity`) |
| `/contract` | iso | `FITMENT_MODULE`, `fitmentManifest`, entities, condition tree types and `ReplaceConditionsSchema`, `FitmentMatch`, ports, `fitmentTranslations` |
| `/core` | iso | rules: `conditions/` (attribute builders, operators, validation, storage, summaries, texts), `matching/` (evaluation, production windows) |
| `/admin` | iso | `fitmentAdmin` (admin definition, path `fitments`) |
| `/admin/ui` | admin | `ConditionsDrawer`, `ConditionsSection`, `fitmentSections` (source only) |

**Ports** (`src/contract/ports.ts`): the module knows no vehicle field. Its domain plugs in, at startup on the server and in the admin, the catalog conditions may test and the translations stored summaries are written in:

```ts
import { provideConditionAttributes, provideConditionTranslations } from "@repo/module-fitment/contract";
import { attributesFromSchema } from "@repo/module-fitment/core";
provideConditionAttributes(attributesFromSchema(Vehicle.schema, { group: "Vehicle" }));
provideConditionTranslations(resources); // toAdminI18n(...) of the domain
```

After changing entities: `yarn workspace @repo/module-fitment db:generate`.
