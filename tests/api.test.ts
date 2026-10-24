import assert from 'node:assert/strict'
import { test } from 'node:test'

const base = process.env.CATALOGUE_BASE_URL ?? 'http://127.0.0.1:3100'
const request = (path: string) => fetch(`${base}${path}`)

test('live PostgreSQL listing, search, pagination, prices and details', async () => {
  const all = await request('/api/products')
  assert.equal(all.status, 200)
  const first = await all.json()
  assert.equal(first.currency, 'GBP')
  assert.equal(first.pageSize, 12)
  assert.ok(first.total >= 48)
  assert.equal(first.items.length, 12)
  const second = await (await request('/api/products?page=2')).json()
  assert.ok(first.items.every((p: { id: string }) => !second.items.some((other: { id: string }) => other.id === p.id)))
  const match = await (await request('/api/products?q=DEMO-1-2')).json()
  assert.equal(match.items.length, 1)
  assert.equal(match.items[0].slug, 'demo-amethyst-ring')
  assert.equal(match.items[0].priceFromPence, 4750)
  const detail = await (await request('/api/products/demo-amethyst-ring')).json()
  assert.equal(detail.name, 'DEMO Amethyst Ring')
  assert.equal(detail.currency, 'GBP')
  assert.equal(detail.variants[0].pricePence, 4750)
  assert.equal(detail.variants[0].stockOnHand, 2)
  assert.equal(detail.variants[0].isAvailable, true)
  const made = await (await request('/api/products/demo-amethyst-pendant')).json()
  assert.equal(made.variants[0].inventoryMode, 'made_to_order')
  assert.equal(made.variants[0].stockOnHand, null)
  assert.equal(made.variants[0].isAvailable, true)
})

test('live API handles empty results, invalid input, unavailable slugs and health', async () => {
  for (const path of ['/api/products?q=no-such-demo-product-298726', '/api/products?page=10000']) {
    const response = await request(path)
    assert.equal(response.status, 200)
    assert.deepEqual((await response.json()).items, [])
  }
  for (const suffix of ['page=0', 'page=-1', 'page=1.2', 'page=10001', 'page=abc', 'page=1&page=2', 'q=a&q=b', `q=${'x'.repeat(101)}`]) {
    assert.equal((await request(`/api/products?${suffix}`)).status, 400, suffix)
  }
  for (const slug of ['no-such-product-298726', 'INVALID', 'a'.repeat(151)]) {
    const response = await request(`/api/products/${slug}`)
    assert.equal(response.status, 404)
    assert.equal((await response.json()).statusMessage, 'Product not found')
  }
  assert.equal((await request('/products/no-such-product-298726')).status, 404)
  const health = await request('/api/health')
  assert.equal(health.status, 200)
  assert.equal((await health.json()).status, 'ok')
})
