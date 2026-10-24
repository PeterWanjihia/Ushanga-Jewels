import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { test } from 'node:test'

for (const connection of ['', 'postgresql://127.0.0.1:1/ushanga_dev']) {
  test(`production server safely handles ${connection ? 'a failed connection' : 'missing configuration'}`, async () => {
    const server = spawn(process.execPath, ['.output/server/index.mjs'], {
      env: { ...process.env, NUXT_DATABASE_URL: connection, NITRO_HOST: '127.0.0.1', NITRO_PORT: '3102' },
      stdio: 'ignore',
    })
    const stopped = once(server, 'exit')
    try {
      let ready = false
      for (let i = 0; i < 60; i++) {
        try { ready = (await fetch('http://127.0.0.1:3102/api/health')).ok } catch {}
        if (ready) break
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      assert.ok(ready, 'production server must start')
      for (const path of ['/api/products', '/api/products/demo-amethyst-ring']) {
        const response = await fetch(`http://127.0.0.1:3102${path}`)
        assert.equal(response.status, 503)
        const body = await response.text()
        assert.match(body, /temporarily unavailable/)
        assert.doesNotMatch(body, /postgresql|SELECT|ECONNREFUSED|password|connectionString|stack/i)
      }
      assert.equal((await fetch('http://127.0.0.1:3102/api/products/INVALID')).status, 404)
      const page = await fetch('http://127.0.0.1:3102/products/demo-amethyst-ring')
      assert.equal(page.status, 503)
      assert.match(await page.text(), /The piece could not be loaded/)
    } finally {
      server.kill('SIGTERM')
      await stopped
    }
  })
}
