import { getDatabase } from '../db'
import { products } from '../db/schema'

export default defineEventHandler(async () => {
  try {
    return await getDatabase().select().from(products)
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to load products',
    })
  }
})
