import { and, asc, count, eq, exists, ilike, inArray, or } from 'drizzle-orm'
import { getDatabase } from '../db'
import { products, productVariants } from '../db/schema'

const PAGE_SIZE = 12

export default defineEventHandler(async (event) => {
  const params = getQuery(event)
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 100) : ''
  const requestedPage = typeof params.page === 'string' ? Number(params.page) : 1
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, 10000)
    : 1

  try {
    const db = getDatabase()
    const activeVariant = exists(
      db.select({ id: productVariants.id }).from(productVariants).where(and(
        eq(productVariants.productId, products.id),
        eq(productVariants.isActive, true),
      )),
    )
    // Escape SQL LIKE wildcards so searches are literal text.
    const query = q.replace(/[\\%_]/g, '\\$&')
    const matchesSearch = q
      ? or(
          ilike(products.name, `%${query}%`),
          ilike(products.description, `%${query}%`),
          exists(db.select({ id: productVariants.id }).from(productVariants).where(and(
            eq(productVariants.productId, products.id),
            eq(productVariants.isActive, true),
            or(
              ilike(productVariants.sku, `%${query}%`),
              ilike(productVariants.label, `%${query}%`),
            ),
          ))),
        )
      : undefined
    const condition = and(eq(products.status, 'active'), activeVariant, matchesSearch)

    const [totals, productRows] = await Promise.all([
      db.select({ value: count() }).from(products).where(condition),
      db.select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        description: products.description,
      }).from(products).where(condition).orderBy(asc(products.name), asc(products.id))
        .limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    ])

    const variants = productRows.length
      ? await db.select({
          productId: productVariants.productId,
          pricePence: productVariants.pricePence,
          inventoryMode: productVariants.inventoryMode,
          stockOnHand: productVariants.stockOnHand,
        }).from(productVariants).where(and(
          inArray(productVariants.productId, productRows.map(row => row.id)),
          eq(productVariants.isActive, true),
        ))
      : []

    const items = productRows.flatMap((product) => {
      const available = variants.filter(variant => variant.productId === product.id)
      if (available.length === 0) return []
      return [{
        ...product,
        priceFromPence: Math.min(...available.map(variant => variant.pricePence)),
        isAvailable: available.some(variant => variant.inventoryMode === 'made_to_order' || (variant.stockOnHand ?? 0) > 0),
      }]
    })

    return { items, page, total: totals[0]?.value ?? 0, pageSize: PAGE_SIZE }
  } catch (error) {
    console.error('Catalog query failed', error instanceof Error ? error.message : 'unknown error')
    throw createError({ statusCode: 503, statusMessage: 'The catalog is temporarily unavailable' })
  }
})
