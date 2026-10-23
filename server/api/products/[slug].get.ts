import { and, eq } from 'drizzle-orm'
import { getDatabase } from '../../db'
import { products, productVariants } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') ?? ''
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 150) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }

  try {
    const db = getDatabase()
    const [product] = await db.select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      description: products.description,
    }).from(products).where(and(eq(products.slug, slug), eq(products.status, 'active'))).limit(1)

    if (!product) {
      throw createError({ statusCode: 404, statusMessage: 'Product not found' })
    }

    const variants = await db.select({
      id: productVariants.id,
      sku: productVariants.sku,
      label: productVariants.label,
      pricePence: productVariants.pricePence,
      inventoryMode: productVariants.inventoryMode,
      stockOnHand: productVariants.stockOnHand,
    }).from(productVariants).where(and(
      eq(productVariants.productId, product.id),
      eq(productVariants.isActive, true),
    ))

    if (variants.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Product not found' })
    }

    return { ...product, variants }
  } catch (error) {
    if ((error as { statusCode?: number })?.statusCode === 404) throw error
    console.error('Product query failed', error instanceof Error ? error.message : 'unknown error')
    throw createError({ statusCode: 503, statusMessage: 'The product is temporarily unavailable' })
  }
})
