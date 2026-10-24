import { test, expect } from '@playwright/test'

const fixture = {
  id: 'browser-fixture', slug: 'demo-browser-fixture', name: 'DEMO Browser Fixture',
  description: 'Demonstration listing for browser testing.', currency: 'GBP',
  variants: [
    { id: 'tracked', sku: 'DEMO-TRACKED', label: 'Standard', pricePence: 4750, inventoryMode: 'tracked', stockOnHand: 2, isAvailable: true },
    { id: 'made', sku: 'DEMO-MADE', label: 'Made to order', pricePence: 5500, inventoryMode: 'made_to_order', stockOnHand: null, isAvailable: true },
    { id: 'sold', sku: 'DEMO-SOLD', label: 'Sold out option', pricePence: 6000, inventoryMode: 'tracked', stockOnHand: 0, isAvailable: false },
  ],
}

test('live catalogue supports search, pagination, details and browser history without overflow', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.locator('.product-card')).toHaveCount(12)
  await expect(page.getByText('Development catalogue:', { exact: false })).toBeVisible()
  await expect(page.locator('.pagination')).toContainText('Page 1 of 4')
  const firstTitle = await page.locator('.product-card h3').first().textContent()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.locator('.pagination')).toContainText('Page 2 of 4')
  await expect(page.locator('.product-card h3').first()).not.toHaveText(firstTitle!)
  await page.getByRole('button', { name: 'Previous' }).click()
  await expect(page.locator('.product-card h3').first()).toHaveText(firstTitle!)
  await page.getByRole('searchbox').fill('DEMO-1-2')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(page.locator('.product-card')).toHaveCount(1)
  await expect(page.locator('.product-card')).toContainText('DEMO Amethyst Ring')
  await expect(page.locator('.product-price')).toHaveText('From £47.50')
  await page.reload()
  await expect(page.getByRole('searchbox')).toHaveValue('DEMO-1-2')
  await page.locator('.product-card').click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('DEMO Amethyst Ring')
  await expect(page.locator('.detail-price')).toHaveText('£47.50')
  await expect(page.locator('.detail-availability')).toHaveText('Available · 2 in stock')
  await expect(page.locator('.demo-notice')).toContainText('Demonstration product')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: `/tmp/ushanga-detail-${test.info().project.name}.png`, fullPage: true })
  await page.goBack()
  await expect(page.getByRole('searchbox')).toHaveValue('DEMO-1-2')
  await page.getByRole('button', { name: 'Clear search' }).click()
  await expect(page.locator('.product-card')).toHaveCount(12)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  const columns = await page.locator('.product-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)
  expect(columns).toBe(page.viewportSize()!.width > 850 ? 3 : 1)
  await page.screenshot({ path: `/tmp/ushanga-catalogue-${test.info().project.name}.png`, fullPage: true })
  await page.locator('.section-heading').scrollIntoViewIfNeeded()
  await page.screenshot({ path: `/tmp/ushanga-catalogue-viewport-${test.info().project.name}.png` })
  expect(errors).toEqual([])
})

test('live search empty state, out-of-range recovery, and missing detail state', async ({ page }) => {
  await page.goto('/?q=no-such-demo-product-298726')
  await expect(page.getByRole('heading', { name: 'No matching pieces' })).toBeVisible()
  await page.goto('/?page=10000')
  await expect(page.getByRole('heading', { name: 'No pieces on this page' })).toBeVisible()
  await page.getByRole('button', { name: 'Back to first page' }).click()
  await expect(page.locator('.product-card')).toHaveCount(12)
  const response = await page.goto('/products/no-such-product-298726')
  expect(response!.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'Piece not found' })).toBeVisible()
})

test('variant selection updates price, reference and availability; slug navigation refetches', async ({ page }) => {
  await page.goto('/')
  await page.route('**/api/products/demo-amethyst-bracelet', route => route.fulfill({ json: fixture }))
  await page.route('**/api/products/demo-amethyst-earrings', route => route.fulfill({ json: { ...fixture, id: 'next-fixture', name: 'DEMO Next Fixture', variants: [fixture.variants[1]] } }))
  await page.locator('a[href="/products/demo-amethyst-bracelet"]').click()
  await expect(page.locator('.detail-price')).toHaveText('£47.50')
  await page.getByRole('button', { name: 'Made to order', exact: true }).click()
  await expect(page.locator('.detail-price')).toHaveText('£55.00')
  await expect(page.locator('.detail-availability')).toHaveText('Made to order')
  await page.getByRole('button', { name: 'Sold out option' }).click()
  await expect(page.locator('.detail-price')).toHaveText('£60.00')
  await expect(page.locator('.detail-availability')).toHaveText('Currently out of stock')
  await expect(page.locator('.detail-reference')).toHaveText('Reference: DEMO-SOLD')
  await page.evaluate(async () => {
    const root = document.querySelector('#__nuxt') as HTMLElement & {
      __vue_app__: { config: { globalProperties: { $router: { push: (path: string) => Promise<void> } } } }
    }
    await root.__vue_app__.config.globalProperties.$router.push('/products/demo-amethyst-earrings')
  })
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('DEMO Next Fixture')
  await expect(page.locator('.detail-price')).toHaveText('£55.00')
})

test('loading, safe API failure and retry states', async ({ page }) => {
  await page.goto('/')
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('**/api/products?*', async route => {
    await gate
    await route.fulfill({ status: 503, json: { statusCode: 503, statusMessage: 'The catalogue is temporarily unavailable' } })
  })
  await page.getByRole('searchbox').fill('temporary')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(page.locator('.catalog-state[role="status"]')).toContainText('Discovering the collection')
  release()
  await expect(page.getByRole('alert')).toContainText("The collection couldn't be loaded")
  await page.unroute('**/api/products?*')
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('heading', { name: 'No matching pieces' })).toBeVisible()

  await page.getByRole('button', { name: 'Clear search' }).click()
  await expect(page.locator('.product-card')).toHaveCount(12)
  await page.route('**/api/products/demo-amethyst-bracelet', route => route.fulfill({ status: 503, json: { statusCode: 503, statusMessage: 'The product is temporarily unavailable' } }))
  await page.locator('a[href="/products/demo-amethyst-bracelet"]').click()
  await expect(page.getByRole('heading', { name: 'The piece could not be loaded' })).toBeVisible()
  await page.unroute('**/api/products/demo-amethyst-bracelet')
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('DEMO Amethyst Bracelet')
})
