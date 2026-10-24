
import { getDatabase } from '../../db'
import {
  findCatalogueProduct,
  isValidProductSlug,
} from '../../services/catalogue'

export default defineEventHandler(async (event) => {
  // 1. Extract the product slug from the URL.
  const slug = getRouterParam(event, 'slug') ?? ''

  // 2. Reject invalid product identifiers.
  if (!isValidProductSlug(slug)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Product not found',
    })
  }

  let product: Awaited<ReturnType<typeof findCatalogueProduct>>

  // 3. Retrieve the product from the catalogue service.
  try {
    const db = getDatabase()

    product = await findCatalogueProduct(db, slug)
  } catch (error) {
    // Log a safe classification, never raw database errors.
    console.error('[catalogue] Failed to retrieve product', {
      errorType: error instanceof Error ? error.name : 'UnknownError',
    })

    throw createError({
      statusCode: 503,
      statusMessage: 'The product is temporarily unavailable',
    })
  }

  // 4. A missing or non-public product returns HTTP 404.
  if (!product) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Product not found',
    })
  }

  // 5. Return the publicly visible product and its variants.
  return product
})
