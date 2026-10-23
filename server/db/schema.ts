import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const productStatus = pgEnum('product_status', [
  'draft',
  'active',
  'archived',
])

export const inventoryMode = pgEnum('inventory_mode', [
  'tracked',
  'made_to_order',
])

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  status: productStatus('status').notNull().default('draft'),
  ...timestamps,
})

export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    sku: text('sku').notNull().unique(),
    label: text('label').notNull(),
    pricePence: integer('price_pence').notNull(),
    inventoryMode: inventoryMode('inventory_mode').notNull(),
    stockOnHand: integer('stock_on_hand'),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (table) => [
    index('product_variants_product_id_idx').on(table.productId),
    check('product_variants_price_positive', sql`${table.pricePence} > 0`),
    check(
      'product_variants_stock_matches_mode',
      sql`(
        (${table.inventoryMode} = 'tracked' AND ${table.stockOnHand} IS NOT NULL AND ${table.stockOnHand} >= 0)
        OR
        (${table.inventoryMode} = 'made_to_order' AND ${table.stockOnHand} IS NULL)
      )`,
    ),
  ],
)
