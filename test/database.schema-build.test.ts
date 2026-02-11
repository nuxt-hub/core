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

  it('resolves @nuxthub/db/schema imports to local schema entry during build', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'nuxthub-schema-build-alias-'))
    const buildDir = join(rootDir, '.nuxt')
    const entryPath = join(buildDir, 'hub/db/schema.entry.ts')
    const outputPath = join(buildDir, 'hub/db/schema.mjs')
    const localSchemaPath = join(buildDir, 'local/schema.ts')
    const localConsumerPath = join(buildDir, 'local/comments.ts')
    const externalSchemaPath = join(rootDir, 'node_modules/@nuxthub/db/schema.mjs')

    try {
      await mkdir(join(buildDir, 'hub/db'), { recursive: true })
      await mkdir(join(buildDir, 'local'), { recursive: true })
      await mkdir(join(rootDir, 'node_modules/@nuxthub/db'), { recursive: true })

      await writeFile(localSchemaPath, 'export const pages = { id: "local-pages" }\n')
      await writeFile(localConsumerPath, 'import { pages } from \'@nuxthub/db/schema\'\nexport const pageIdFromAlias = pages.id\n')
      await writeFile(externalSchemaPath, 'export const externalOnly = true\n')
      await writeFile(entryPath, `export * from '${localSchemaPath}'\nexport * from '${localConsumerPath}'\n`)

      await buildDatabaseSchema(buildDir, { relativeDir: rootDir })

      const builtModule = await import(pathToFileURL(outputPath).href)
      expect(builtModule.pages.id).toBe('local-pages')
      expect(builtModule.pageIdFromAlias).toBe('local-pages')
    }
    finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })
})
