import { access, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildDatabaseSchema, buildDatabaseSchemaTypes } from '../src/db/lib/build'
import { supportsDtsGeneration } from '../src/db/lib/ts-version'

const exists = (path: string) => access(path).then(() => true, () => false)

async function createSchemaBuildDir(prefix: string) {
  const rootDir = await mkdtemp(join(tmpdir(), prefix))
  const buildDir = join(rootDir, '.nuxt')
  const schemaSource = join(rootDir, 'server/db/schema.ts')
  await mkdir(dirname(schemaSource), { recursive: true })
  await mkdir(join(buildDir, 'hub/db'), { recursive: true })
  await writeFile(schemaSource, 'export interface User { id: number, name: string }\nexport const users = { name: \'users\' as const }\n')
  await writeFile(join(buildDir, 'hub/db/schema.entry.ts'), `export * from '${schemaSource}'\n`)
  return { rootDir, buildDir, js: join(buildDir, 'hub/db/schema.mjs'), dts: join(buildDir, 'hub/db/schema.d.mts') }
}

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

  it('builds only schema.mjs when types are turned off', async () => {
    const { rootDir, buildDir, js, dts } = await createSchemaBuildDir('nuxthub-schema-build-js-')

    try {
      await buildDatabaseSchema(buildDir, { relativeDir: rootDir, types: false })

      expect(await exists(js)).toBe(true)
      expect(await exists(dts)).toBe(false)
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it('builds only schema.d.mts with the same declarations as the full build', async () => {
    const { rootDir, buildDir, js, dts } = await createSchemaBuildDir('nuxthub-schema-build-types-')
    const schemaSource = join(rootDir, 'server/db/schema.ts')
    const cwd = process.cwd()

    try {
      // Like an app: drizzle-orm is a dependency, so the declarations import it
      await writeFile(join(rootDir, 'package.json'), JSON.stringify({ dependencies: { 'drizzle-orm': '*' } }))
      await symlink(resolve('node_modules'), join(rootDir, 'node_modules'), 'junction')
      await writeFile(schemaSource, [
        'import { relations } from \'drizzle-orm\'',
        'import { integer, sqliteTable, text } from \'drizzle-orm/sqlite-core\'',
        'export const users = sqliteTable(\'users\', { id: integer().primaryKey(), name: text().notNull() })',
        'export const posts = sqliteTable(\'posts\', { id: integer().primaryKey(), authorId: integer().notNull() })',
        'export const usersRelations = relations(users, ({ many }) => ({ posts: many(posts) }))',
        ''
      ].join('\n'))
      process.chdir(rootDir)

      await buildDatabaseSchema(buildDir, { relativeDir: rootDir })
      const fullBuildJs = await readFile(js, 'utf8')
      const fullBuildTypes = await readFile(dts, 'utf8')
      expect(fullBuildTypes).toContain('from "drizzle-orm"')
      await rm(dts)

      expect(await buildDatabaseSchemaTypes(buildDir, { relativeDir: rootDir })).toBe(true)

      expect(await readFile(dts, 'utf8')).toBe(fullBuildTypes)
      expect(await readFile(js, 'utf8')).toBe(fullBuildJs)
      expect(await exists(join(buildDir, 'hub/db/.types'))).toBe(false)
    } finally {
      process.chdir(cwd)
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
