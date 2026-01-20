import type { Nuxt } from '@nuxt/schema'
import type { ResolvedDatabaseConfig, ResolvedHubConfig } from '@nuxthub/core'

export type OrmType = 'drizzle' | 'prisma'
export type Dialect = 'sqlite' | 'postgresql' | 'mysql'
export type Driver = 'better-sqlite3' | 'libsql' | 'bun-sqlite' | 'd1' | 'd1-http' | 'postgres-js' | 'pglite' | 'neon-http' | 'mysql2'

export interface HubDbAdapterContext {
  nuxt: Nuxt
  hub: ResolvedHubConfig
  dbConfig: ResolvedDatabaseConfig
}

/**
 * Adapter interface for ORM integrations.
 * Implementations generate client code, type definitions, and handle ORM-specific setup.
 */
export interface HubDbAdapter {
  /** Unique adapter identifier */
  name: OrmType

  /** Default schema file path (e.g., 'server/db/schema.ts' for Drizzle, 'prisma/schema.prisma' for Prisma) */
  schemaPath: string

  /** Validate schema exists and is correctly configured */
  validateSchema(ctx: HubDbAdapterContext): Promise<void>

  /** Generate the runtime client module code exported from 'hub:db' */
  createClientCode(ctx: HubDbAdapterContext): string

  /** Generate TypeScript declaration for 'hub:db' module */
  getClientTypes(ctx: HubDbAdapterContext): string

  /** Start database studio UI (optional). Returns the port number. */
  startStudio?(ctx: HubDbAdapterContext, port: number): Promise<number>

  /** Runtime dependencies required by this adapter (e.g., 'drizzle-orm') */
  requiredDeps: string[]

  /** Dev dependencies required by this adapter (e.g., 'drizzle-kit') */
  requiredDevDeps: string[]

  /** Returns list of missing dependencies based on installed deps and driver */
  checkMissingDeps(installedDeps: Record<string, string>, driver: Driver): string[]

  /** Hook called during 'prepare:types' for additional setup (e.g., Prisma generate) */
  onPrepareTypes?(ctx: HubDbAdapterContext): Promise<void>
}

/** Registry of available adapters */
const adapters = new Map<OrmType, () => Promise<HubDbAdapter>>()

export function registerAdapter(name: OrmType, loader: () => Promise<HubDbAdapter>) {
  adapters.set(name, loader)
}

export async function getAdapter(name: OrmType): Promise<HubDbAdapter> {
  const loader = adapters.get(name)
  if (!loader) {
    throw new Error(`Unknown ORM adapter: ${name}. Available: ${[...adapters.keys()].join(', ')}`)
  }
  return loader()
}

export function getAvailableAdapters(): OrmType[] {
  return [...adapters.keys()]
}

// Register built-in adapters
registerAdapter('drizzle', () => import('./drizzle').then(m => m.drizzleAdapter))
registerAdapter('prisma', () => import('./prisma').then(m => m.prismaAdapter))
