# Product Requirements Document — Snap Store

**Auto-Parts E-Commerce Platform**
**Version:** 1.0 — Initial Engineering Draft
**Date:** March 2026
**Status:** In Progress

---

## 1. Overview

Snap Store is a B2C auto-parts e-commerce catalog platform. Shoppers find parts that fit their specific vehicle by selecting a Year / Make / Model / Engine combination ("fitment"), then browse a filtered product catalog. The platform is built as a Turborepo monorepo with a Medusa v2 backend and a Next.js 16 storefront.

---

## 2. Goals

| Goal                        | Description                                                                             |
| --------------------------- | --------------------------------------------------------------------------------------- |
| **Fitment-first discovery** | Shoppers select their vehicle upfront; the catalog only shows compatible parts          |
| **Structured catalog**      | Products are organized in a category hierarchy; filtering by type, price, options       |
| **Transactional**           | Full add-to-cart → checkout flow backed by Medusa's commerce engine                     |
| **Operator tooling**        | Admins manage fitment data (Makes, Models, Engines, Fitments) and link them to products |
| **Scalable content**        | Product images hosted on MinIO/S3; regions and currencies via Medusa regions            |

---

## 3. Users

| Persona     | Description                                                                    |
| ----------- | ------------------------------------------------------------------------------ |
| **Shopper** | End customer browsing for auto parts; vehicle-aware product discovery          |
| **Admin**   | Internal operator managing catalog, fitment data, product-fitment associations |

---

## 4. Architecture

### 4.1 Monorepo Workspaces

| Workspace                      | Path                             | Role                                                           |
| ------------------------------ | -------------------------------- | -------------------------------------------------------------- |
| `medusa`                       | `apps/medusa`                    | Medusa v2 backend — API server, database, business logic       |
| `storefront`                   | `apps/storefront`                | Next.js 16 App Router frontend — shopper-facing catalog        |
| `@repo/vehicle-fitment-plugin` | `plugins/vehicle-fitment-plugin` | Medusa plugin — fitment data models, APIs, admin UI            |
| `@repo/common`                 | `packages/common`                | Shared controllers, services, schemas (used by backend/plugin) |
| `@repo/ui`                     | `packages/ui`                    | Shared React UI components (used by storefront)                |
| `@repo/tsconfig`               | `packages/tsconfig`              | Shared TypeScript configurations                               |
| `@repo/eslint-config`          | `packages/eslint-config`         | Shared ESLint configurations                                   |

### 4.2 Infrastructure

| Component          | Technology                                               |
| ------------------ | -------------------------------------------------------- |
| **Backend**        | Medusa v2 (v2.13.1), Node.js >= 20, PostgreSQL           |
| **Cache / Events** | Redis (via Medusa cache-redis + event-bus-redis modules) |
| **File Storage**   | MinIO (S3-compatible, via Medusa file-s3 module)         |
| **Notifications**  | Local email provider (via Medusa notification module)    |
| **Analytics**      | `@agilo/medusa-analytics-plugin`                         |
| **Frontend**       | Next.js 16, React 19, Tailwind CSS v4                    |
| **State**          | Zustand (client product-list store)                      |
| **Deployment**     | Docker Compose (`docker/`)                               |

---

## 5. Vehicle Fitment System

The fitment system is the core differentiator of this platform. It is entirely implemented in `@repo/vehicle-fitment-plugin`.

### 5.1 Data Model

```
FitmentMake (e.g. "Toyota")
  └── FitmentModel (e.g. "Corolla")
        └── Fitment (specific vehicle config)
              ├── FitmentEngine (fuel, type, size, tech)
              ├── year_start / year_end
              ├── body_style (SEDAN | SUV | HATCHBACK | COUPE | CONVERTIBLE | WAGON | VAN | PICKUP)
              ├── doors
              ├── drive (FWD | RWD | AWD | FOUR_WD)
              └── transmission (MANUAL | AUTOMATIC | CVT)
```

**Module links:**

- `Product ↔ Fitment` — many-to-many, both deleteCascade
- `Customer ↔ Fitment` — many-to-many with `session_id` join column, both deleteCascade

### 5.2 Shopper Fitment Flow

1. Shopper visits any page; `FitmentBadge` (async Server Component) checks for an existing fitment cookie.
2. If no fitment is set, `FitmentBadge` renders a `FitmentDialog` trigger (the children slot, e.g. a "Find My Parts" CTA).
3. `FitmentDialog` opens and renders `FitmentForm` — a cascading selector:
   - **Year** → triggers `listMakesAction` server action → fetches `/store/makes?year_start=X&year_end=X`
   - **Make** → filters models from the returned data
   - **Model** → filters engines from the returned data
   - **Engine** → user selects specific engine spec
4. On submit, `addFitment(fitmentId)` sets `_medusa_fitment_id` cookie (httpOnly, 7-day, strict sameSite).
5. Product listing calls `/store/products/v2` with `fitment_id` query parameter — only compatible parts are returned.
6. The badge displays the selected vehicle (Make + Model name). A clear button calls `clearFitment()`.

**Known issues to fix:**

- `retreiveFitment()` only fetches `id,year_start,year_end,engine` — missing `model.make.name` and `model.name` fields needed by `FitmentBadge`.
- `clearFitment` is wired as `onClick` inside a Server Component — needs a Client Component wrapper.

### 5.3 Admin Fitment Management

Full CRUD UI contributed by the plugin to the Medusa admin dashboard:

| Admin Section             | Path                                          | Capability                            |
| ------------------------- | --------------------------------------------- | ------------------------------------- |
| Fitments list             | `/fitments`                                   | Data table with bulk actions, filters |
| Create fitment            | `/fitments/create`                            | Modal form                            |
| Edit fitment              | `/fitments/:id/edit`                          | Drawer form                           |
| Fitment products          | `/fitments/:id/products`                      | List + link/unlink products           |
| Makes                     | `/fitments/makes`                             | CRUD                                  |
| Models                    | `/fitments/models`                            | CRUD                                  |
| Engines                   | `/fitments/engines`                           | CRUD                                  |
| Product fitments (widget) | Product detail page (`product.details.after`) | Paginated fitments table, link/unlink |
| Product fitments page     | `/products/:id/fitments`                      | Full fitment linking UI               |

---

## 6. Product Catalog

### 6.1 Category Structure

- Products are organized in a tree of `ProductCategory` nodes (Medusa built-in).
- Root categories are served at top-level slugs (e.g. `/brakes`, `/suspension`).
- Sub-categories resolve via the catch-all route `[...slug]`.
- The header renders a `CategoryNavMenu` and a `CategoryMenuSheet` (mobile) sourced from `listCategories()`.

### 6.2 Product Listing

**Route:** `[...slug]/page.tsx` → `ProductListTemplate`

**Data source:** `/store/products/v2` (custom store route from fitment plugin)

**Query parameters:**

- `fitment_id` — from `_medusa_fitment_id` cookie (vehicle filter)
- `category_id[]` — current category
- `region_id` / `currency_code` — from `getRegion('tn')` (hardcoded — see known issues)
- `order`, `limit`, `offset` — pagination/sorting

**Fields fetched:**

```
*variants.calculated_price
+variants.inventory_quantity
*variants.images
+metadata
+tags
```

**Display modes:** Grid (`ProductList` with `ProductGridItem`) and List view toggle.

**Sorting:** Client-side sort after fetching 100 products — options: price asc/desc, name asc/desc.

**Filtering:**

- Price range slider (`PriceSlider`)
- Option checkboxes (`CategoryFilters`) — driven by Zustand store
- Filters accessible via `FilterDrawerButton` (mobile drawer)

**Product card features:**

- Product image, name, price display (with sale badge)
- `WishlistButton`
- Inventory quantity

**Known issues to fix:**

- `handleOptionChange` and `removeOptions` in Zustand store are no-ops — filter checkboxes are non-functional.
- Region is hardcoded to `'tn'` — no locale/country detection.
- `categories/tempates/` directory is empty (typo "tempates" instead of "templates").

### 6.3 Product Detail Page

**Status: Not yet implemented.**

Requirements:

- Route: `app/products/[handle]/page.tsx`
- Fetch product by handle
- Display: images gallery, title, description, variant selector, price, fitment compatibility list
- Add to cart action

### 6.4 Home Page

**Route:** `/` → `HomeTemplate`

**Current state:** Scaffolded. Best-sellers carousel has 5 empty slots (product fetch not wired). `AdvancedSearch` component is commented out.

**Required features:**

- Best-sellers product carousel with real products
- Fitment vehicle selector (`AdvancedSearch`) — prominent CTA
- Category navigation links

---

## 7. Cart & Checkout

**Status: Scaffolded / Not functional.**

### 7.1 Cart Sheet

- `CartButton` in header triggers `CartList` sheet.
- `CartList` component has inverted condition — shows "empty" state when products exist.
- `CartItem` component is an empty stub.

### 7.2 Requirements

| Feature          | Description                                                                    |
| ---------------- | ------------------------------------------------------------------------------ |
| Cart creation    | `POST /store/carts` on first add-to-cart; persist `_medusa_cart_id` cookie     |
| Add to cart      | `POST /store/carts/:id/line-items` — from product detail page                  |
| Cart display     | `CartItem` renders: image, name, variant, quantity stepper, line total, remove |
| Cart totals      | Subtotal, tax, shipping estimate, total                                        |
| Checkout         | Standard Medusa checkout flow (address → shipping → payment → confirmation)    |
| Guest checkout   | No account required                                                            |
| Customer account | Optional — saved fitments, order history                                       |

### 7.3 Saved Fitments (Customer Link)

The `Customer ↔ Fitment` module link (with `session_id`) is already defined. When a customer logs in, their saved fitment(s) can be retrieved and re-applied.

---

## 8. API Reference

### 8.1 Store Routes

| Method | Path                        | Source            | Description                                       |
| ------ | --------------------------- | ----------------- | ------------------------------------------------- |
| `GET`  | `/store/products/v2`        | fitment plugin    | Products filtered by fitment_id + standard params |
| `GET`  | `/store/makes`              | fitment plugin    | Makes list, filterable by year range              |
| `GET`  | `/store/engines`            | fitment plugin    | Engines list                                      |
| `GET`  | `/store/fitments`           | fitment plugin    | Fitments list                                     |
| `GET`  | `/store/fitments/:id`       | fitment plugin    | Single fitment by ID                              |
| `GET`  | `/store/product-categories` | Medusa core       | Category tree                                     |
| `GET`  | `/store/products`           | Medusa core       | Standard product listing                          |
| `GET`  | `/store/regions`            | Medusa core       | Regions list                                      |
| `GET`  | `/store/product-types`      | Medusa core       | Product types                                     |
| `GET`  | `/store/product-tags`       | Medusa core       | Product tags                                      |
| `GET`  | `/store/custom`             | medusa app (stub) | Placeholder — not implemented                     |

### 8.2 Admin Routes (fitment plugin)

| Resource           | Endpoints                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| Makes              | `GET/POST /admin/makes`, `GET/PATCH/DELETE /admin/makes/:id`, batch `PATCH /admin/makes`       |
| Models             | `GET/POST /admin/models`, `GET/PATCH/DELETE /admin/models/:id`, batch `PATCH /admin/models`    |
| Engines            | `GET/POST /admin/engines`, `GET/PATCH/DELETE /admin/engines/:id`, batch `PATCH /admin/engines` |
| Fitments           | `GET/POST /admin/fitments`, `GET/PATCH/DELETE /admin/fitments/:id`                             |
| Fitment ↔ Products | `GET/POST /admin/fitments/:id/products`, `DELETE /admin/fitments/:id/products/:productId`      |
| Product ↔ Fitments | `GET/POST /admin/products/:id/fitments`, `DELETE /admin/products/:id/fitments/:fitmentId`      |

---

## 9. Shared Packages

### 9.1 `@repo/common`

Used by Medusa backend and the fitment plugin.

| Export                     | Purpose                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| `BaseController`           | Abstract controller with `execute()`, `success()`, `created()`, `noContent()`, `handleError()` |
| `ApiErrorHandler`          | Maps errors → HTTP status codes (404/400/401/403/500); detects "not found" in message          |
| `MedusaLoggerAdapter`      | Logger adapter wrapping Medusa's scoped logger                                                 |
| `BaseSchema` / `BASE_MASK` | Zod base schema (id, timestamps); `BASE_MASK` for `.omit()` on create inputs                   |

### 9.2 `@repo/ui`

Shared React component library (shadcn/ui style — CVA + Radix primitives).

| Component(s)               | Notes                                                                             |
| -------------------------- | --------------------------------------------------------------------------------- |
| `Button`, `buttonVariants` | Variants: default, destructive, outline, secondary, ghost, link                   |
| `Badge`, `badgeVariants`   | Same variants + ghost, link                                                       |
| `Card` suite               | Card, CardHeader, CardFooter, CardTitle, CardContent, CardDescription, CardAction |
| `Input`                    | Standard input                                                                    |
| `Label`                    | Radix Label                                                                       |
| `Select` suite             | Full select with scroll buttons                                                   |
| `Sheet` suite              | Slide-in panel (top/bottom/left/right)                                            |
| `Drawer` suite             | Vaul-based bottom drawer                                                          |
| `Tabs` suite               | Horizontal/vertical, default/line variants                                        |
| `Field` suite              | Form field layout with label, description, error, group                           |
| `Separator`                | Horizontal/vertical separator                                                     |
| `Popover` suite            | Radix Popover                                                                     |
| `DropdownMenu` suite       | Full Radix DropdownMenu                                                           |
| `NavigationMenu` suite     | Radix NavigationMenu                                                              |
| `RadioGroup` suite         | Radix RadioGroup                                                                  |
| `Carousel` suite           | Embla-based carousel                                                              |
| `Icons`                    | Custom icon components                                                            |
| `cn()`                     | `clsx` + `twMerge` utility                                                        |

---

## 10. Workflows (Fitment Plugin)

| Workflow                   | Input                       | Steps                                            | Compensation                   |
| -------------------------- | --------------------------- | ------------------------------------------------ | ------------------------------ |
| `create-fitments-workflow` | `{ fitments, product_id? }` | `createFitmentsStep`                             | Delete created fitments        |
| `update-fitment-workflow`  | `UpdateFitmentInput`        | `updateFitmentStep`                              | Restore original data snapshot |
| `delete-fitment-workflow`  | `{ id }`                    | `dismissFitmentLinksStep` → `deleteFitmentsStep` | Restore links; restore fitment |

---

## 11. Known Bugs & Incomplete Features

| #   | Area              | Issue                                                                                      | Priority |
| --- | ----------------- | ------------------------------------------------------------------------------------------ | -------- |
| 1   | Fitment badge     | `retreiveFitment()` missing `model.make.name`, `model.name` fields — badge shows undefined | High     |
| 2   | Fitment badge     | `clearFitment` as `onClick` on Server Component child — will not fire                      | High     |
| 3   | Product filtering | `handleOptionChange` + `removeOptions` in Zustand store are no-ops — checkboxes do nothing | High     |
| 4   | Cart              | `CartList` has inverted if/else — shows empty state when cart has items                    | High     |
| 5   | Cart              | `CartItem` is an empty stub — cart items render nothing                                    | High     |
| 6   | Home page         | Best-sellers carousel has no data — `ProductGridItem` call is commented out                | Medium   |
| 7   | Home page         | `AdvancedSearch` is commented out — vehicle selector CTA is hidden                         | Medium   |
| 8   | Product detail    | No product detail page exists — no add-to-cart flow                                        | High     |
| 9   | Cart              | No cart creation / add-to-cart server actions                                              | High     |
| 10  | Region            | `getRegion('tn')` hardcoded — no locale/country detection                                  | Medium   |
| 11  | Categories        | `categories/tempates/` directory is empty + directory name has typo ("tempates")           | Low      |

---

## 12. Remaining Features to Implement

### Phase 1 — Critical Path (Catalog + Cart)

| Feature                              | Files to create/modify                                             |
| ------------------------------------ | ------------------------------------------------------------------ |
| Fix `retreiveFitment` fields         | `apps/storefront/src/lib/data/fitments.ts`                         |
| Fix `FitmentBadge` clear button      | `apps/storefront/src/modules/fitment/components/fitment-badge.tsx` |
| Fix `CartList` inverted condition    | `apps/storefront/src/modules/cart/components/cart-sheet.tsx`       |
| Implement `CartItem` component       | `apps/storefront/src/modules/cart/components/cart-item.tsx`        |
| Implement Zustand filter actions     | `apps/storefront/src/modules/products/store.ts`                    |
| Wire home page best-sellers          | `apps/storefront/src/modules/home/templates/index.tsx`             |
| Enable `AdvancedSearch` on home page | `apps/storefront/src/modules/home/templates/index.tsx`             |
| Product detail page                  | `apps/storefront/src/app/products/[handle]/page.tsx`               |
| Cart server actions                  | `apps/storefront/src/lib/data/cart.ts`                             |
| Add-to-cart integration              | Product detail page + cart sheet                                   |

### Phase 2 — Commerce Completion

| Feature                   | Notes                                                          |
| ------------------------- | -------------------------------------------------------------- |
| Checkout flow             | Address, shipping, payment, confirmation pages                 |
| Customer accounts         | Registration, login, order history, saved fitments             |
| Region / locale detection | Replace hardcoded `'tn'`                                       |
| Search                    | Full-text product search (integrate with Medusa search module) |
| Wishlist                  | Persist `WishlistButton` state                                 |

### Phase 3 — Operations

| Feature                | Notes                                                        |
| ---------------------- | ------------------------------------------------------------ |
| Product import tooling | Bulk import products with fitment associations               |
| Order management       | Admin order views (Medusa built-in + any custom)             |
| Analytics              | `@agilo/medusa-analytics-plugin` integration — dashboards    |
| Email notifications    | Order confirmation, shipping updates via notification module |
| SEO                    | Meta tags, sitemap, structured data                          |

---

## 13. Environment Configuration

| Variable                             | Used by    | Purpose                           |
| ------------------------------------ | ---------- | --------------------------------- |
| `DATABASE_URL`                       | Medusa     | PostgreSQL connection             |
| `REDIS_URL`                          | Medusa     | Redis connection (cache + events) |
| `STORE_CORS`                         | Medusa     | Allowed storefront origin(s)      |
| `ADMIN_CORS`                         | Medusa     | Allowed admin origin(s)           |
| `AUTH_CORS`                          | Medusa     | Allowed auth origin(s)            |
| `JWT_SECRET`                         | Medusa     | JWT signing secret                |
| `COOKIE_SECRET`                      | Medusa     | Cookie signing secret             |
| `MINIO_FILE_URL`                     | Medusa     | MinIO public URL                  |
| `MINIO_ACCESS_KEY_ID`                | Medusa     | MinIO access key                  |
| `MINIO_SECRET_ACCESS_KEY`            | Medusa     | MinIO secret key                  |
| `MINIO_REGION`                       | Medusa     | MinIO region                      |
| `MINIO_BUCKET`                       | Medusa     | MinIO bucket name                 |
| `MINIO_ENDPOINT`                     | Medusa     | MinIO endpoint URL                |
| `MEDUSA_BACKEND_URL`                 | Storefront | Backend API base URL              |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Storefront | Publishable API key for SDK       |

---

## 14. Developer Setup

```bash
# Install dependencies
yarn install

# Start all services
yarn dev

# Start backend only
yarn workspace medusa dev

# Start storefront only
yarn workspace storefront dev

# Run tests
yarn workspace medusa test:integration:http
yarn workspace medusa test:unit

# Build all
yarn build

# Type check
yarn check-types

# Lint
yarn lint
```

Docker:

```bash
yarn docker:dev    # Start development containers
yarn docker:down   # Stop containers
```
