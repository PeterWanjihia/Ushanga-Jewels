import { config } from 'dotenv'
import pg from 'pg'

export function devClient() {
  config({ quiet: true })
  if (process.env.USHANGA_DB_TARGET !== 'dev') throw new Error('Database tests require USHANGA_DB_TARGET=dev')
  const url = new URL(process.env.NUXT_DATABASE_URL ?? '')
  if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.port !== '5434' || url.pathname !== '/ushanga_dev') {
    throw new Error('Database tests are restricted to local ushanga_dev on port 5434')
  }
  return new pg.Client({ connectionString: url.toString(), connectionTimeoutMillis: 3000 })
}
