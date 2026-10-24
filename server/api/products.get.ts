
import { getDatabase } from '../db'
import {
  listCatalogueProducts,
  parseCatalogueQuery,
} from '../services/catalogue'

export default defineEventHandler(async (event) => {
  let query: ReturnType<typeof parseCatalogueQuery>

  // 1. Validate incoming search and pagination parameters.
  try {
    query = parseCatalogueQuery(getQuery(event))
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid catalogue search or page',
    })
  }

  // 2. Retrieve products from the catalogue service.
  try {
    const db = getDatabase()

    return await listCatalogueProducts(db, query)
  } catch (error) {
    // Log a safe error classification, never raw database errors.
    // Driver messages can contain SQL parameters or connection details.
    console.error('[catalogue] Failed to retrieve products', {
      errorType: error instanceof Error ? error.name : 'UnknownError',
    })

    throw createError({
      statusCode: 503,
      statusMessage: 'The catalogue is temporarily unavailable',
    })
  }
})
