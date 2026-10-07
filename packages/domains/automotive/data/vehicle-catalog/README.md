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

Makes and model lines of the Tunisian market, one file per make (72 makes, 528 models),
retrieved 2026-10-07: the current new-car lineup (298 models) and the older park still bought,
sold and repaired (230 more: Peugeot 205/206/405/504, Renault 4/21/Symbol, Citroën C15/AX,
Fiat Uno/Palio, Isuzu TFR/N-Series, Iveco Daily, Mercedes 190…).

- **Sources** (cited per model): automobile.tn "Prix du neuf" (models sold by official
  dealers); automobile.tn used-car listings (models on sale second-hand); tayara.tn car search
  keywords (models people look for, e.g. "peugeot 404 tunisie"); Isuzu D-Max and MU-X from
  press coverage of its Kairouan assembly. A park model is listed only with such evidence.
- **Facts only:** make and model names and their category; no prices, specifications, text
  or images were copied (automobile.tn's terms reserve its content).
- **Curation:** powertrain, cab, load and seat variants are folded into their model line
  (`Hilux Simple/Double Cabine` → `Hilux`, `Sportage PHEV` → `Sportage`); body styles sold as
  their own model lines are kept (`Q3 Sportback`, `GLC Coupé`); international model names
  (`1 Series`, `A-Class`) so a licensed catalog (TecDoc) matches the same records; Omoda and
  Jaecoo are separate makes; Haval, Tank, Poer and Wingle stay under Great Wall. Category is
  `LCV` when every variant is commercial (pickups, vans, minibuses), else `CAR`.

**Not included:** generations, engines and configurations. No open source has them at
production quality: Wikidata's generations are incomplete (Kia Rio has none; Clio III has
only a start date) and its engines are just "diesel/petrol". They need a licensed source
(TecDoc, a specs database export); the importer takes them in the same format.
Re-check the lineup periodically: new-car ranges change every year.
