# @repo/module-garage

Garage module (Medusa key `garage`): the vehicles customers saved (`CustomerVehicle`, "my vehicles"), with an optional build date that narrows fitments. Reusable by any domain. Layers: contract → core → adapters (see AGENTS.md).

| Entry | Layer | Contents |
|---|---|---|
| `@repo/module-garage` | server | the Medusa module: `GarageModuleService` (`listGarage`, `retrieveGarageVehicle`, one default vehicle per customer), models, migrations, `garageRoutes` (`/admin/garage/:entity`) |
| `/contract` | iso | manifest, entities, types, ports, translations: the only entry other modules may import |
| `/admin` | iso | admin definition |

Dependencies: `vehicle` (contract only). `customer` and `vehicle` are column links (`customer_id`, `vehicle_id`); the domain declares the read-only `defineLink`s, and labels vehicles in garage responses (the service never resolves the vehicle module). After changing entities: `yarn workspace @repo/module-garage db:generate`, and commit the migration.
