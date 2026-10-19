import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'
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

  it('publishes the database migrations entrypoint', async () => {
    const rootDir = fileURLToPath(new URL('..', import.meta.url))
    const consumerDir = await mkdtemp(join(rootDir, '.package-exports-'))
    const packageDir = join(consumerDir, 'node_modules/@nuxthub/core')
    const tarballPath = join(consumerDir, 'nuxthub-core.tgz')

    try {
      await mkdir(packageDir, { recursive: true })
      await execa('pnpm', ['--config.ignore-scripts=true', 'pack', '--out', tarballPath], { cwd: rootDir })
      await execa('tar', ['-xzf', tarballPath, '--strip-components=1', '-C', packageDir])

      const { stdout } = await execa(process.execPath, [
        '--input-type=module',
        '--eval',
        `const migrations = await import('@nuxthub/core/db/migrations')
if (typeof migrations.applyDatabaseMigrations !== 'function' || typeof migrations.applyDatabaseQueries !== 'function') process.exit(1)
console.log('ok')`
      ], { cwd: consumerDir })

      expect(stdout).toBe('ok')
    } finally {
      await rm(consumerDir, { recursive: true, force: true })
    }
  })
})
