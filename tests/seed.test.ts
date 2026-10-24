import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { devClient } from './dev-database.ts'

test('demo seed is repeatable, retains all records and creates 48 valid demo products and variants', async () => {
  const client = devClient()
  await client.connect()
  try {
    const snapshot = async () => (await client.query(`SELECT
      (SELECT jsonb_agg(p ORDER BY id) FROM products p) AS products,
      (SELECT jsonb_agg(v ORDER BY id) FROM product_variants v) AS variants`)).rows[0]
    const before = await snapshot()
    const run = spawnSync('pnpm', ['db:seed:demo'], { env: { ...process.env, USHANGA_DB_TARGET: 'dev' }, encoding: 'utf8' })
    assert.equal(run.status, 0, 'demo seed must exit successfully; output withheld to protect credentials')
    assert.deepEqual(await snapshot(), before, 'repeat seed must not alter any existing record or add duplicates')
    const { rows: [counts] } = await client.query(`SELECT
      (SELECT count(*)::int FROM products) AS products,
      (SELECT count(*)::int FROM product_variants) AS variants,
      (SELECT count(*)::int FROM products WHERE slug LIKE 'demo-%') AS demo_products,
      (SELECT count(*)::int FROM product_variants WHERE sku LIKE 'DEMO-%') AS demo_variants,
      (SELECT count(*)::int FROM products p JOIN product_variants v ON v.product_id=p.id
       WHERE p.slug LIKE 'demo-%' AND p.name LIKE 'DEMO %' AND p.status='active'
       AND v.sku LIKE 'DEMO-%' AND v.is_active AND v.price_pence > 0
       AND ((v.inventory_mode='made_to_order' AND v.stock_on_hand IS NULL)
         OR (v.inventory_mode='tracked' AND v.stock_on_hand >= 0))) AS valid_demo_variants`)
    assert.equal(counts.demo_products, 48)
    assert.equal(counts.demo_variants, 48)
    assert.equal(counts.valid_demo_variants, 48)
    const samples = (await client.query(`SELECT p.slug, p.name, v.sku, v.price_pence, v.inventory_mode, v.stock_on_hand
      FROM products p JOIN product_variants v ON v.product_id=p.id WHERE v.sku LIKE 'DEMO-%'`)).rows
    const gems = ['Amethyst', 'Garnet', 'Moonstone', 'Onyx', 'Peridot', 'Opal', 'Rose Quartz', 'Ruby', 'Sapphire', 'Topaz', 'Turquoise', 'Zircon']
    const styles = ['Pendant', 'Ring', 'Earrings', 'Bracelet']
    for (const [gemIndex, gem] of gems.entries()) {
      for (const [styleIndex, style] of styles.entries()) {
        const sample = samples.find(row => row.sku === `DEMO-${gemIndex + 1}-${styleIndex + 1}`)
        assert.ok(sample)
        assert.equal(sample.name, `DEMO ${gem} ${style}`)
        assert.equal(sample.slug, `demo-${gem.toLowerCase().replaceAll(' ', '-')}-${style.toLowerCase()}`)
        assert.equal(sample.price_pence, 3500 + gemIndex * 550 + styleIndex * 1250)
        assert.equal(sample.inventory_mode, styleIndex % 2 === 0 ? 'made_to_order' : 'tracked')
        assert.equal(sample.stock_on_hand, styleIndex % 2 === 0 ? null : 2 + gemIndex % 5)
      }
    }
    console.log('Verified database row counts:', counts)
  } finally { await client.end() }
})

test('demo seed rejects the lab target before connecting', () => {
  const run = spawnSync('pnpm', ['db:seed:demo'], {
    env: { ...process.env, USHANGA_DB_TARGET: 'lab' }, encoding: 'utf8',
  })
  assert.notEqual(run.status, 0)
  assert.match(run.stderr, /restricted to USHANGA_DB_TARGET=dev/)
})
