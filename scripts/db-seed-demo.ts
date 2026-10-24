import { config } from 'dotenv'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { products, productVariants } from '../server/db/schema.ts'

// Explicitly opt in: this script must never target a real client or lab database.
if (process.env.USHANGA_DB_TARGET !== 'dev' || !process.argv.includes('--demo')) {
  throw new Error('Demo data is restricted to USHANGA_DB_TARGET=dev and requires --demo')
}

const result = config({ path: '.env.docker', quiet: true })
if (result.error) throw result.error

const password = process.env.USHANGA_DEV_PASSWORD
if (!password) throw new Error('Missing USHANGA_DEV_PASSWORD in .env.docker')

const gems = [
  'Amethyst', 'Garnet', 'Moonstone', 'Onyx', 'Peridot', 'Opal',
  'Rose Quartz', 'Ruby', 'Sapphire', 'Topaz', 'Turquoise', 'Zircon',
] as const
const styles = ['Pendant', 'Ring', 'Earrings', 'Bracelet'] as const
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const pool = new pg.Pool({
  host: '127.0.0.1', port: 5434,
  user: 'ushanga_dev', database: 'ushanga_dev', password, ssl: false,
})

try {
  // Repeated runs are additive and idempotent. Existing product records are never overwritten.
  await drizzle(pool).transaction(async (tx) => {
    for (const [gemIndex, gem] of gems.entries()) {
      for (const [styleIndex, style] of styles.entries()) {
        const name = `DEMO ${gem} ${style}`
        const slug = `demo-${slugify(gem)}-${slugify(style)}`
        await tx.insert(products).values({
          slug,
          name,
          description: `Demonstration listing for a ${gem.toLowerCase()} ${style.toLowerCase()}. Replace with approved product details before launch.`,
          status: 'active',
        }).onConflictDoNothing({ target: products.slug })

        const [product] = await tx.select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1)
        if (!product) throw new Error(`Unable to find seeded product: ${slug}`)

        const madeToOrder = styleIndex % 2 === 0
        await tx.insert(productVariants).values({
          productId: product.id,
          sku: `DEMO-${gemIndex + 1}-${styleIndex + 1}`,
          label: madeToOrder ? 'Made to order' : 'Standard',
          pricePence: 3500 + gemIndex * 550 + styleIndex * 1250,
          inventoryMode: madeToOrder ? 'made_to_order' : 'tracked',
          stockOnHand: madeToOrder ? null : 2 + (gemIndex % 5),
        }).onConflictDoNothing({ target: productVariants.sku })
      }
    }
  })
  console.log('Dev-only demo seed completed: 48 catalog samples (safe to rerun)')
} catch {
  console.error('Demo seed failed; connection details withheld')
  process.exitCode = 1
} finally {
  await pool.end()
}
