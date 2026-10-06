# @repo/module-fitment

Fitment module (Medusa key `fitment`): which product variant fits which vehicle (`Fitment`: position, quantity, production window) and under which conditions (condition groups on vehicle fields). Depends on `vehicle` (`Fitment.vehicle` is a column link; it uses `@repo/module-vehicle/entities` only).

| Entry | Contents |
|---|---|
| `@repo/module-fitment` | the Medusa module: `FitmentModuleService` (`replaceConditions`, `findMatching`, `filterCompatible`), models, migrations |
| `/entities` | entity definitions (isomorphic) |
| `/conditions` | the condition tree: validation, storage, summary, and the attribute catalog port (isomorphic) |
| `/http` | generic admin API `/admin/fitments/:entity` (`fitmentRoutes`, `FITMENTS_PATH`) |
| `/admin` | `fitmentAdmin` (path `fitments`), `fitmentTranslations` (en, fr, ar) |
| `/admin/ui` | `ConditionsDrawer`, `ConditionsSection`, `fitmentSections` (admin UI, bundled from source) |
| `/manifest` | `fitmentManifest` |

**Condition attributes are injected.** The module knows no vehicle field: the domain registers the catalog conditions may test, on the server and in the admin.

```ts
import { provideConditionAttributes, attributesFromSchema } from "@repo/module-fitment/conditions";
provideConditionAttributes([...attributesFromSchema(Vehicle.schema, { group: "Vehicle" })]);
```

After changing entities: `yarn workspace @repo/module-fitment db:generate`.
