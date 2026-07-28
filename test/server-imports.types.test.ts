import { fileURLToPath } from 'node:url'
import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { setup, useTestContext } from '@nuxt/test-utils'

// Nitro generates server auto-import types as relative directory imports, e.g.
// `const db: typeof import('../../node_modules/@nuxthub/db').db`. TypeScript
// ignores the `exports` field for relative paths, so the generated virtual
// packages must also expose top-level `main`/`types` for the imports to resolve
// to their real types instead of `any`. See #811.
describe('server auto-import types', async () => {
  await setup({ rootDir: fileURLToPath(new URL('./fixtures/wrangler', import.meta.url)), dev: true })

  const packages = ['db', 'blob', 'kv']

  it.each(packages)('@nuxthub/%s package.json exposes resolvable main/types', async (name) => {
    const { nuxt } = useTestContext()
    const dir = join(nuxt!.options.rootDir, 'node_modules', '@nuxthub', name)
    const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))

    // top-level fields are required: relative directory imports bypass `exports`
    expect(pkg.main).toBeTruthy()
    expect(pkg.types).toBeTruthy()

    // and they must agree with the `exports` entry so the two resolution paths
    // (bare specifier vs relative path) can never drift apart
    expect(pkg.main).toBe(pkg.exports['.'].default)
    expect(pkg.types).toBe(pkg.exports['.'].types)

    // the referenced files must actually exist on disk
    await expect(access(join(dir, pkg.main))).resolves.toBeUndefined()
    await expect(access(join(dir, pkg.types))).resolves.toBeUndefined()
  })
})
