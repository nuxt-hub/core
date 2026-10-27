import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildDatabaseSchema } from '../src/db/lib/build'
import { supportsDtsGeneration } from '../src/db/lib/ts-version'

function toImportSpecifier(fromFile: string, toFile: string) {
  const relativePath = relative(dirname(fromFile), toFile).replace(/\\/g, '/')
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`
}

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
      await writeFile(entryPath, `export * from '${toImportSpecifier(entryPath, schemaSource)}'\n`)

      await buildDatabaseSchema(buildDir, { relativeDir: rootDir })

      const output = await readFile(outputPath, 'utf8')
      expect(output.includes('export * from "/')).toBe(false)

      await rm(schemaSource, { force: true })
      const builtModule = await import(pathToFileURL(outputPath).href)
      expect(builtModule.schemaBuildMarker).toBe('ok')
    } finally {
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
      await writeFile(
        entryPath,
        `export * from '${toImportSpecifier(entryPath, localSchemaPath)}'\nexport * from '${toImportSpecifier(entryPath, localConsumerPath)}'\n`
      )

      await buildDatabaseSchema(buildDir, { relativeDir: rootDir })

      const builtModule = await import(pathToFileURL(outputPath).href)
      expect(builtModule.pages.id).toBe('local-pages')
      expect(builtModule.pageIdFromAlias).toBe('local-pages')
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it('reuses cached schema types until a file they depend on changes', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'nuxthub-schema-build-types-cache-'))
    const buildDir = join(rootDir, '.nuxt')
    const entryPath = join(buildDir, 'hub/db/schema.entry.ts')
    const typesPath = join(buildDir, 'hub/db/schema.d.mts')
    const schemaPath = join(rootDir, 'server/db/schema.ts')
    // Only imported for its types, so it is not part of the schema.mjs bundle
    const metaPath = join(rootDir, 'server/db/meta.ts')

    try {
      await mkdir(dirname(schemaPath), { recursive: true })
      await mkdir(dirname(entryPath), { recursive: true })
      await writeFile(metaPath, 'export interface Meta { tags: string[] }\n')
      await writeFile(schemaPath, 'import type { Meta } from \'./meta\'\nexport const users = { meta: null as unknown as Meta }\n')
      await writeFile(entryPath, `export * from '${toImportSpecifier(entryPath, schemaPath)}'\n`)

      await buildDatabaseSchema(buildDir, { relativeDir: rootDir })
      expect(await readFile(typesPath, 'utf8')).toContain('tags: string[]')

      // Nuxt clears the build directory, except `cache`, when it starts
      await rm(typesPath)
      await writeFile(join(buildDir, 'cache/nuxthub/db/schema.d.mts'), '// cached types\n')
      await buildDatabaseSchema(buildDir, { relativeDir: rootDir })
      expect(await readFile(typesPath, 'utf8')).toBe('// cached types\n')

      await writeFile(metaPath, 'export interface Meta { labels: string[] }\n')
      await buildDatabaseSchema(buildDir, { relativeDir: rootDir })
      expect(await readFile(typesPath, 'utf8')).toContain('labels: string[]')
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it('skips dts generation when TypeScript 7 is resolved', () => {
    // The native TypeScript port has no JS compiler API, so `rolldown-plugin-dts`
    // crashes while emitting `.d.ts` files. `.d.mts` types are optional anyway:
    // `hub:db:schema` falls back to `export * from './schema.mjs'` when missing.
    expect(supportsDtsGeneration('7.0.2')).toBe(false)
    expect(supportsDtsGeneration('7.0.0-dev.20251223.1')).toBe(false)
    expect(supportsDtsGeneration('6.0.0')).toBe(true)
    expect(supportsDtsGeneration('5.9.3')).toBe(true)
    expect(supportsDtsGeneration(undefined)).toBe(true)
  })
})
