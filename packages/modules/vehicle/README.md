# @repo/module-vehicle

Vehicle module (Medusa key `vehicle`): makes, models, generations, engines, configurations (`Vehicle`), external references and customer garages (`CustomerVehicle`). No dependencies. Layers: contract → core → adapters (see AGENTS.md).

| Entry | Layer | Contents |
|---|---|---|
| `@repo/module-vehicle` | server | the Medusa module: `VehicleModuleService` (years within a generation, one default garage vehicle), models, migrations, `vehicleRoutes` (`/admin/vehicles/:entity`) |
| `/contract` | iso | `VEHICLE_MODULE`, `vehicleManifest`, entities (one file each in `src/contract/entities/`), enums, label formats, `vehicleTranslations` |
| `/admin` | iso | `vehicleAdmin` (admin definition, path `vehicles`) |

Rules on the module's own rows run in `src/server/hooks.ts`. After changing entities: `yarn workspace @repo/module-vehicle db:generate`.
