# Ushanga.Jewels

Nuxt 4 storefront foundation with PostgreSQL, Drizzle, a searchable product catalog, and product variant pages. The product data is served from the database, not hardcoded in the UI.

## Setup

Requires [Node.js](https://nodejs.org/) 22.22.3+ on Node 22, 24.15+ on Node 24, or 26+ (matching Nuxt’s supported engines; database scripts and tests use native TypeScript support) and [pnpm](https://pnpm.io/).

```bash
pnpm install
```

Use `.env.example` as a guide and create a local `.env` with `NUXT_DATABASE_URL` pointing at your **development** PostgreSQL instance. `.env` and `.env.docker` are intentionally ignored by Git. Do not commit credentials.

The database containers and versioned migrations must already be running/applied. The Docker database uses port **5434** for development and **5433** for the separate lab.

## Development

Start the development server at `http://localhost:3000`:

```bash
pnpm dev
```

Confirm the server is running:

```bash
curl http://localhost:3000/api/health
```

Catalog endpoints:

```bash
curl 'http://localhost:3000/api/products?page=1&q=ring'
curl 'http://localhost:3000/api/products/demo-amethyst-ring'
```

`GET /api/products` returns active products with active variants, paginated in groups of 12, including a starting price and availability. The detail endpoint returns a single active product and its active variants. Both endpoints identify the currency as `GBP`; prices remain integer pence. Tracked variants are available only when stock is positive, while made-to-order variants are available without a stock count. Disabled variants never appear or contribute to search, price, or availability. Products without enabled variants are hidden.

Search is case-insensitive across product names/descriptions and enabled variant SKUs/labels. SQL wildcard characters are treated literally. `q` must be a single string of at most 100 characters; `page` must be a single integer from 1 to 10000. Invalid input returns 400, unavailable product details return 404, and database failures return a generic 503 without connection details. Pages beyond the last page return an empty `items` array. Ordering is stable by product name then ID. Search and page selection are preserved in the storefront URL and browser history.

To seed **48 explicitly labelled demonstration products** in `ushanga_dev` only:

```bash
USHANGA_DB_TARGET=dev pnpm db:seed:demo
```

The demo seed is idempotent and does not delete or overwrite real records. Do **not** use demo items on a live customer site. Replace them with approved product names, images and prices before launch.

Check types:

```bash
pnpm typecheck
```

## Production

```bash
pnpm build
pnpm preview
```

## Project structure

```
app/                 # Nuxt 4 application source
  app.vue            # Root Vue component
  pages/             # File-based routes
    index.vue        # Homepage + catalog search
    products/[slug].vue  # Product details and variants
server/              # Nitro server
  api/
    health.get.ts    # GET /api/health
    products.get.ts  # GET /api/products
    products/[slug].get.ts  # GET /api/products/:slug
  db/                # Server-only Drizzle/Postgres connection + schema
scripts/db-seed-demo.ts # Explicit, dev-only demo data
public/              # Static files served as-is
nuxt.config.ts       # Nuxt configuration
tsconfig.json        # TypeScript project references (Nuxt-generated configs)
```

## Step 3 verification

With the local development database running, migrations applied, `.env` configured, and the demo seed run:

```bash
pnpm typecheck
pnpm build
pnpm test
pnpm test:api:failure
pnpm exec playwright install chromium --no-shell
pnpm test:e2e
```

`pnpm test` checks real PostgreSQL catalogue queries using temporary fixtures inside a transaction that is rolled back. It also reruns the demo seed and compares every existing product and variant before and after to verify idempotency. Tests reject any target other than local `ushanga_dev` on port 5434. They never reset or delete database records. Demo seeding is restricted to development and adds 48 demo products, each with one variant; it preserves existing records.

`pnpm test:api:failure` uses the production build to verify safe failures with missing configuration and an unreachable local database address. It does not connect to the development or lab database.

`pnpm test:e2e` opens Chromium at desktop (1440px), mobile (390px), and small mobile (320px) widths. It checks live database-backed catalogue navigation and uses intercepted responses for multi-variant, loading, and failure states without changing database records. Browser artifacts are ignored by Git.

Playwright starts a local development server on port 3100 when needed. To use an already-running instance, specify its URL:

```bash
CATALOGUE_BASE_URL=http://127.0.0.1:3002 pnpm test:e2e
CATALOGUE_BASE_URL=http://127.0.0.1:3002 pnpm test:api
```

`pnpm test:api` requires a running application and smoke-tests its catalogue and health endpoints against the seeded development database. The live browser checks expect the 48 demo products (four pages).

The storefront explicitly labels demo products and placeholder artwork. Approved product photography and business copy remain outside this development catalogue. No checkout, carts, orders, authentication, or payment/email integrations are included.
