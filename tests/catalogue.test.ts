import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { drizzle } from 'drizzle-orm/node-postgres'
import { devClient } from './dev-database.ts'
import { products, productVariants } from '../server/db/schema.ts'
import { findCatalogueProduct, listCatalogueProducts, parseCatalogueQuery } from '../server/services/catalogue.ts'

const client = devClient()
const db = drizzle(client)
const prefix = `test-${randomUUID()}`
const ids: string[] = []
const slug = (i: number) => `${prefix}-${i}`

before(async () => {
  await client.connect()
  await client.query('BEGIN')
  // Fixtures live only in this transaction and are always rolled back.
  for (let i = 0; i < 18; i++) {
    const [product] = await db.insert(products).values({
      slug: slug(i), name: `${prefix} ${String(i).padStart(2, '0')}`,
      description: i === 0 ? `${prefix} literal 50% a_b path\\leaf` : prefix,
      status: i === 14 ? 'draft' : i === 15 ? 'archived' : 'active',
    }).returning({ id: products.id })
    ids.push(product!.id)
    if (i === 17) continue
    await db.insert(productVariants).values({
      productId: product!.id, sku: `${prefix}-sku-${i}`, label: `${prefix}-option-${i}`,
      pricePence: 1000 + i, inventoryMode: 'tracked', stockOnHand: i <= 1 ? 0 : 2,
      isActive: i !== 16,
    })
  }
  await db.insert(productVariants).values([
    { productId: ids[0]!, sku: `${prefix}-made`, label: 'Made to order', pricePence: 2500, inventoryMode: 'made_to_order', stockOnHand: null },
    { productId: ids[0]!, sku: `${prefix}-stock`, label: 'In stock', pricePence: 3500, inventoryMode: 'tracked', stockOnHand: 3 },
    { productId: ids[0]!, sku: `${prefix}-hidden`, label: `${prefix}-hidden`, pricePence: 1, inventoryMode: 'tracked', stockOnHand: 10, isActive: false },
  ])
})

after(async () => {
  try { await client.query('ROLLBACK') } finally { await client.end() }
})

test('input validation rejects malformed, duplicate, and oversized inputs', () => {
  assert.deepEqual(parseCatalogueQuery({}), { q: '', page: 1 })
  assert.deepEqual(parseCatalogueQuery({ q: ' ring ', page: '2' }), { q: 'ring', page: 2 })
  for (const page of ['0', '-1', '1.5', 'abc', '', '1e2', '10001', ['1', '2']]) {
    assert.throws(() => parseCatalogueQuery({ page }))
  }
  for (const q of [['a', 'b'], 'x'.repeat(101), 12]) assert.throws(() => parseCatalogueQuery({ q }))
})

test('listing excludes drafts, archives, disabled-only and variantless products', async () => {
  const result = await listCatalogueProducts(db, { q: prefix, page: 1 })
  assert.equal(result.total, 14)
  assert.equal(result.items.length, 12)
  assert.equal(result.pageSize, 12)
  assert.equal(result.currency, 'GBP')
  assert.deepEqual(result.items.map(p => p.id), ids.slice(0, 12))
})

test('pagination is stable with no duplicates and handles pages beyond the end', async () => {
  const first = await listCatalogueProducts(db, { q: prefix, page: 1 })
  const second = await listCatalogueProducts(db, { q: prefix, page: 2 })
  assert.deepEqual(second.items.map(p => p.id), ids.slice(12, 14))
  assert.equal(new Set([...first.items, ...second.items].map(p => p.id)).size, 14)
  assert.deepEqual((await listCatalogueProducts(db, { q: prefix, page: 3 })).items, [])
})

test('search matches names, descriptions, active SKUs and labels case insensitively', async () => {
  for (const q of [`${prefix} 00`.toUpperCase(), `${prefix}-sku-0`, `${prefix}-option-0`, 'literal 50% a_b path\\leaf']) {
    const result = await listCatalogueProducts(db, { q, page: 1 })
    assert.deepEqual(result.items.map(p => p.id), [ids[0]])
  }
  assert.equal((await listCatalogueProducts(db, { q: `${prefix}-hidden`, page: 1 })).total, 0)
})

test('LIKE wildcards and SQL injection text are treated literally', async () => {
  for (const q of ['50%', 'a_b', 'path\\leaf']) {
    const result = await listCatalogueProducts(db, { q, page: 1 })
    assert.ok(result.items.some(p => p.id === ids[0]))
    assert.ok(result.items.every(p => p.description.includes(q)))
  }
  assert.equal((await listCatalogueProducts(db, { q: "' OR 1=1 --", page: 1 })).total, 0)
  assert.equal((await listCatalogueProducts(db, { q: `${prefix}-missing`, page: 1 })).total, 0)
})

test('starting prices are integer pence, excluding disabled variants; availability follows inventory', async () => {
  const result = await listCatalogueProducts(db, { q: prefix, page: 1 })
  assert.equal(result.items[0]!.priceFromPence, 1000)
  assert.equal(result.items[0]!.isAvailable, true)
  assert.equal(result.items[1]!.isAvailable, false)
  assert.equal(result.items[2]!.isAvailable, true)
})

test('detail returns active variants with exact prices and stock availability', async () => {
  const product = await findCatalogueProduct(db, slug(0))
  assert.ok(product)
  assert.equal(product.currency, 'GBP')
  assert.equal(product.variants.length, 3)
  assert.deepEqual(product.variants.map(v => v.label), ['In stock', 'Made to order', `${prefix}-option-0`])
  assert.equal(product.variants.find(v => v.inventoryMode === 'made_to_order')!.isAvailable, true)
  assert.equal(product.variants.find(v => v.sku === `${prefix}-sku-0`)!.isAvailable, false)
  assert.equal(product.variants.find(v => v.sku === `${prefix}-stock`)!.pricePence, 3500)
  assert.ok(product.variants.every(v => Number.isInteger(v.pricePence)))
})

test('detail safely hides missing, invalid, non-public, and variantless products', async () => {
  for (const value of [slug(14), slug(15), slug(16), slug(17), `${prefix}-absent`, "' OR 1=1", 'a'.repeat(151), 'UPPERCASE']) {
    assert.equal(await findCatalogueProduct(db, value), null)
  }
})
