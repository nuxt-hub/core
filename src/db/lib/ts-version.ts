import { createRequire } from 'node:module'

/**
 * Resolves the TypeScript version used by the project, if any.
 * Returns `undefined` when TypeScript cannot be resolved (it is an optional
 * dependency of `tsdown`, so this is a valid state).
 */
export function resolveTypescriptVersion() {
  try {
    return createRequire(import.meta.url)('typescript/package.json').version
  } catch {
    return undefined
  }
}

/**
 * TypeScript 7 (the native port) does not ship the JS compiler API used by
 * `rolldown-plugin-dts` to emit `.d.ts` files, so tsdown's `dts` option crashes
 * with `Cannot read properties of undefined (reading 'useCaseSensitiveFileNames')`.
 * The generated `schema.d.mts` is only used as a typing hint for `hub:db:schema`
 * and falls back to `export * from './schema.mjs'` when missing, so skip it
 * entirely when TypeScript 7 is resolved.
 */
export function supportsDtsGeneration(typescriptVersion?: string) {
  return !typescriptVersion || Number.parseInt(typescriptVersion.split('.')[0], 10) < 7
}
