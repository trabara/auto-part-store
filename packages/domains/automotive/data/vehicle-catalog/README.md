# Vehicle catalogs

Catalog files (`vehicle-catalog@1`, schema `CatalogFileSchema` in `@repo/module-vehicle/contract`)
imported by the domain's `import-vehicle-catalog` script:

```bash
# from apps/backend (add --dry-run to see what would change)
yarn seed:vehicles
```

Imports are idempotent (records matched by natural key), one transaction per file, and
never overwrite existing records (differences are reported).

## tunisia/

Makes and current model lines sold new in Tunisia, one file per make (61 makes, 298 models),
retrieved 2026-10-07.

- **Source:** automobile.tn "Prix du neuf" (models sold by official dealers), one page per
  make and model, cited in each file; Isuzu (absent there) from press coverage of its
  Kairouan assembly (D-Max, MU-X).
- **Facts only:** make and model names and their category; no prices, specifications, text
  or images were copied (automobile.tn's terms reserve its content).
- **Curation:** powertrain, cab, load and seat variants are folded into their model line
  (`Hilux Simple/Double Cabine` → `Hilux`, `Sportage PHEV` → `Sportage`); body styles sold as
  their own model lines are kept (`Q3 Sportback`, `GLC Coupé`); international model names
  (`1 Series`, `A-Class`) so a licensed catalog (TecDoc) matches the same records; Omoda and
  Jaecoo are separate makes; Haval, Tank, Poer and Wingle stay under Great Wall. Category is
  `LCV` when every variant is commercial (pickups, vans, minibuses), else `CAR`.

**Not included:** generations, engines and configurations (they need a licensed source:
TecDoc, a specs database export), and the older vehicle park (models no longer sold new).
Re-check the lineup periodically: new-car ranges change every year.
