import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

const result = config({ path: '.env.docker', quiet: true })

if (result.error) {
  throw result.error
}

const target = process.env.USHANGA_DB_TARGET

if (target !== 'lab' && target !== 'dev') {
  throw new Error('Specify USHANGA_DB_TARGET=lab or dev')
}

const password = process.env[
  target === 'lab'
    ? 'USHANGA_LAB_PASSWORD'
    : 'USHANGA_DEV_PASSWORD'
]

if (!password) {
  throw new Error(`Missing password for ${target} database`)
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/db/schema.ts',
  out: './drizzle',

  dbCredentials: {
    host: '127.0.0.1',
    port: target === 'lab' ? 5433 : 5434,
    user: `ushanga_${target}`,
    database: `ushanga_${target}`,
    password,
    ssl: false,
  },
})
