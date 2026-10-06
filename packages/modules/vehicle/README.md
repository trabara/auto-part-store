# @repo/module-vehicle

Vehicle module (Medusa key `vehicle`): makes, models, generations, engines, configurations (`Vehicle`), external references and customer garages (`CustomerVehicle`). No dependencies.

| Entry | Contents |
|---|---|
| `@repo/module-vehicle` | the Medusa module: `VehicleModuleService` (years within a generation, one default garage vehicle), models, migrations |
| `/entities` | entity definitions, labels, enums (isomorphic) |
| `/http` | generic admin API `/admin/vehicles/:entity` (`vehicleRoutes`, `VEHICLES_PATH`) |
| `/admin` | `vehicleAdmin` (admin definition, path `vehicles`), `vehicleTranslations` (en, fr, ar) |
| `/manifest` | `vehicleManifest` |

Rules on the module's own rows live in `src/hooks.ts` (imported by `index.ts`). After changing entities: `yarn workspace @repo/module-vehicle db:generate`.
