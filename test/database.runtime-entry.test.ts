import { mkdtemp, rm } from 'node:fs/promises'
import { isBuiltin } from 'node:module'
import { tmpdir } from 'node:os'
import { isAbsolute, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'tsdown'
import { describe, expect, it } from 'vitest'

describe('@nuxthub/core/db', () => {
  it('does not import build tooling', async () => {
    const outDir = await mkdtemp(join(tmpdir(), 'nuxthub-db-entry-'))
    const packages = new Set<string>()
    try {
      await build({
        entry: fileURLToPath(new URL('../src/db/lib/index.ts', import.meta.url)),
        outDir,
        platform: 'node',
        format: 'esm',
        dts: false,
        tsconfig: false,
        logLevel: 'silent',
        plugins: [{
          name: 'collect-packages',
          resolveId: {
            order: 'pre',
            handler(source) {
              if (source.startsWith('.') || isAbsolute(source) || isBuiltin(source)) return
              packages.add(source)
              return { id: source, external: true }
            }
          }
        }]
      })
    } finally {
      await rm(outDir, { recursive: true, force: true })
    }
    expect(packages).toContain('unstorage')
    expect(packages).not.toContain('tsdown')
  })
})
