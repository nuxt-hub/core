import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildDatabaseSchema } from '../src/db/lib/build'

describe('buildDatabaseSchema', () => {
  it('bundles cache-based schema paths so output stays importable', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'nuxthub-schema-build-'))
    const buildDir = join(rootDir, 'node_modules/.cache/nuxt/.nuxt')
    const schemaSource = join(buildDir, 'better-auth/schema.postgresql.ts')
    const entryPath = join(buildDir, 'hub/db/schema.entry.ts')
    const outputPath = join(buildDir, 'hub/db/schema.mjs')

    try {
      await mkdir(join(buildDir, 'better-auth'), { recursive: true })
      await mkdir(join(buildDir, 'hub/db'), { recursive: true })

      await writeFile(schemaSource, 'export const schemaBuildMarker = "ok"\n')
      await writeFile(entryPath, `export * from '${schemaSource}'\n`)

      await buildDatabaseSchema(buildDir, { relativeDir: rootDir })

      const output = await readFile(outputPath, 'utf8')
      expect(output.includes('export * from "/')).toBe(false)

      await rm(schemaSource, { force: true })
      const builtModule = await import(pathToFileURL(outputPath).href)
      expect(builtModule.schemaBuildMarker).toBe('ok')
    }
    finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })
})
