import { fileURLToPath } from 'node:url'
import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { setup, useTestContext } from '@nuxt/test-utils'
import ts from 'typescript'

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

  it('@nuxthub/kv exposes atomic operations to TypeScript consumers', () => {
    const { nuxt } = useTestContext()
    const filename = join(nuxt!.options.rootDir, 'atomic-kv-consumer.ts')
    const normalizedFilename = filename.replace(/\\/g, '/').toLowerCase()
    const isSourceFile = (path: string) => path.replace(/\\/g, '/').toLowerCase() === normalizedFilename
    const source = `import { kv } from '@nuxthub/kv'
void kv.getAndDelete?.<{ value: boolean }>('token')
void kv.increment?.('counter', 60)
`
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      target: ts.ScriptTarget.ESNext,
      strict: true,
      skipLibCheck: true,
      noEmit: true
    }
    const host = ts.createCompilerHost(options)
    const getSourceFile = host.getSourceFile.bind(host)
    host.fileExists = path => isSourceFile(path) || ts.sys.fileExists(path)
    host.readFile = path => isSourceFile(path) ? source : ts.sys.readFile(path)
    host.getSourceFile = (path, languageVersion, onError, shouldCreateNewSourceFile) => isSourceFile(path)
      ? ts.createSourceFile(path, source, languageVersion, true)
      : getSourceFile(path, languageVersion, onError, shouldCreateNewSourceFile)

    const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([filename], options, host))
    expect(diagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))).toEqual([])
  })
})
