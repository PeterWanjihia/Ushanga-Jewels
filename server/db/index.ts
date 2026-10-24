import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

let database: NodePgDatabase | undefined

export function getDatabase() {
  if (!database) {
    const { databaseUrl } = useRuntimeConfig()

    if (!databaseUrl) {
      throw new Error('Database connection is not configured')
    }

    const pool = new pg.Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 5000 })
    // Handle idle connection errors without logging connection details.
    pool.on('error', () => {
      console.error('An idle database connection failed')
    })
    database = drizzle(pool)
  }

  return database
}
