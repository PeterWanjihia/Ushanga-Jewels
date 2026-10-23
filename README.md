# Ushanga.Jewels

Ushanga.Jewels is a Nuxt 4 application. This repository currently contains the application foundation: the Nuxt app, a working homepage, and a health check API.

## Setup

Requires [Node.js](https://nodejs.org/) 20+ and [pnpm](https://pnpm.io/).

```bash
pnpm install
```

## Development

Start the development server at `http://localhost:3000`:

```bash
pnpm dev
```

Confirm the server is running:

```bash
curl http://localhost:3000/api/health
```

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
    index.vue        # Homepage
server/              # Nitro server
  api/
    health.get.ts    # GET /api/health
public/              # Static files served as-is
nuxt.config.ts       # Nuxt configuration
tsconfig.json        # TypeScript project references (Nuxt-generated configs)
```
