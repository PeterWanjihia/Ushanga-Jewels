# Ushanga.Jewels

Nuxt 4 storefront foundation with PostgreSQL, Drizzle, a searchable product catalog, and product variant pages. The product data is served from the database, not hardcoded in the UI.

## Setup

Requires [Node.js](https://nodejs.org/) 20+ and [pnpm](https://pnpm.io/).

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

`GET /api/products` returns active products with active variants, paginated in groups of 12, including a starting price and availability. The detail endpoint returns a single active product and its active variants.

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
