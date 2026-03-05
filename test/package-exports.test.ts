import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

describe('package exports', () => {
  it('defines resolver-compatible root exports', async () => {
    const packageJsonPath = new URL('../package.json', import.meta.url)
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
      exports: Record<string, any>
    }

    expect(packageJson.exports['.']?.default).toBe('./dist/module.mjs')
    expect(packageJson.exports['./package.json']).toBe('./package.json')
  })

  it('can be resolved with require.resolve', () => {
    const require = createRequire(import.meta.url)
    const resolved = require.resolve('@nuxthub/core').replace(/\\/g, '/')

    expect(resolved.endsWith('/dist/module.mjs')).toBe(true)
  })
})
