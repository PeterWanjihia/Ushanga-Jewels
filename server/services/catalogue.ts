
import { and, asc, count, eq, exists, ilike, inArray, or } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { products, productVariants } from '../db/schema.ts'

export const PAGE_SIZE = 12

// Validate catalogue search and pagination parameters.
export function parseCatalogueQuery(params: Record<string, unknown>) {
  if (
    params.q !== undefined
    && (
      typeof params.q !== 'string'
      || params.q.trim().length > 100
    )
  ) {
    throw new Error('Search must be a single string of at most 100 characters')
  }

  if (
    params.page !== undefined
    && (
      typeof params.page !== 'string'
      || !/^[1-9][0-9]{0,4}$/.test(params.page)
      || Number(params.page) > 10000
    )
  ) {
    throw new Error('Page must be an integer between 1 and 10000')
  }

  return {
    q: typeof params.q === 'string' ? params.q.trim() : '',
    page: Number(params.page ?? 1),
  }
}

// Validate product URL slugs.
export function isValidProductSlug(slug: string) {
  return slug.length <= 150
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

// Determine whether a variant can currently be ordered.
export function isVariantAvailable(variant: {
  inventoryMode: string
  stockOnHand: number | null
}) {
  return variant.inventoryMode === 'made_to_order'
    || (variant.stockOnHand ?? 0) > 0
}

// Retrieve searchable, paginated public catalogue products.
export async function listCatalogueProducts(
  db: NodePgDatabase,
  { q, page }: ReturnType<typeof parseCatalogueQuery>,
) {
  // Only include products with at least one enabled variant.
  const activeVariant = exists(
    db
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productId, products.id),
          eq(productVariants.isActive, true),
        ),
      ),
  )

  // Escape SQL LIKE wildcards to search for literal characters.
  const query = q.replace(/[\\%_]/g, '\\$&')

  // Search product names, descriptions, SKUs, and variant labels.
  const matchesSearch = q
    ? or(
        ilike(products.name, `%${query}%`),
        ilike(products.description, `%${query}%`),
        exists(
          db
            .select({ id: productVariants.id })
            .from(productVariants)
            .where(
              and(
                eq(productVariants.productId, products.id),
                eq(productVariants.isActive, true),
                or(
                  ilike(productVariants.sku, `%${query}%`),
                  ilike(productVariants.label, `%${query}%`),
                ),
              ),
            ),
        ),
      )
    : undefined

  // Public products must be active and have enabled variants.
  const condition = and(
    eq(products.status, 'active'),
    activeVariant,
    matchesSearch,
  )

  // Fetch the total number of matches and the requested page.
  const [totals, productRows] = await Promise.all([
    db
      .select({ value: count() })
      .from(products)
      .where(condition),

    db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        description: products.description,
      })
      .from(products)
      .where(condition)
      .orderBy(asc(products.name), asc(products.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
  ])

  // Load enabled variants for products on the current page.
  const variants = productRows.length
    ? await db
        .select({
          productId: productVariants.productId,
          pricePence: productVariants.pricePence,
          inventoryMode: productVariants.inventoryMode,
          stockOnHand: productVariants.stockOnHand,
        })
        .from(productVariants)
        .where(
          and(
            inArray(
              productVariants.productId,
              productRows.map(row => row.id),
            ),
            eq(productVariants.isActive, true),
          ),
        )
    : []

  // Build catalogue cards with orderable starting prices.
  const items = productRows.flatMap((product) => {
    const enabledVariants = variants.filter(
      variant => variant.productId === product.id,
    )

    if (enabledVariants.length === 0) {
      return []
    }

    // Only variants that customers can order influence the price.
    const orderableVariants = enabledVariants.filter(isVariantAvailable)

    const priceFromPence = orderableVariants.length > 0
      ? Math.min(...orderableVariants.map(variant => variant.pricePence))
      : null

    return [{
      ...product,
      priceFromPence,
      isAvailable: orderableVariants.length > 0,
    }]
  })

  return {
    items,
    currency: 'GBP' as const,
    page,
    total: totals[0]?.value ?? 0,
    pageSize: PAGE_SIZE,
  }
}

// Retrieve one publicly visible product and its enabled variants.
export async function findCatalogueProduct(
  db: NodePgDatabase,
  slug: string,
) {
  if (!isValidProductSlug(slug)) {
    return null
  }

  const [product] = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      description: products.description,
    })
    .from(products)
    .where(
      and(
        eq(products.slug, slug),
        eq(products.status, 'active'),
      ),
    )
    .limit(1)

  if (!product) {
    return null
  }

  const variants = await db
    .select({
      id: productVariants.id,
      sku: productVariants.sku,
      label: productVariants.label,
      pricePence: productVariants.pricePence,
      inventoryMode: productVariants.inventoryMode,
      stockOnHand: productVariants.stockOnHand,
    })
    .from(productVariants)
    .where(
      and(
        eq(productVariants.productId, product.id),
        eq(productVariants.isActive, true),
      ),
    )
    .orderBy(
      asc(productVariants.label),
      asc(productVariants.id),
    )

  if (variants.length === 0) {
    return null
  }

  return {
    ...product,
    currency: 'GBP' as const,
    variants: variants.map(variant => ({
      ...variant,
      isAvailable: isVariantAvailable(variant),
    })),
  }
}
