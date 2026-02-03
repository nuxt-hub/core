import type { BuiltinDriverName } from 'unstorage'
import type { FSDriverOptions } from '@nuxthub/core/blob/drivers/fs'
import type { S3DriverOptions } from '@nuxthub/core/blob/drivers/s3'
import type { VercelDriverOptions } from '@nuxthub/core/blob/drivers/vercel-blob'
import type { CloudflareDriverOptions } from '@nuxthub/core/blob/drivers/cloudflare-r2'

export interface HubConfig {
  blob: boolean | BlobConfig
  cache: boolean | CacheConfig
  db: false | 'postgresql' | 'sqlite' | 'mysql' | DatabaseConfig
  kv: boolean | KVConfig
  sandbox: boolean | SandboxConfig
  dir: string
  hosting: string
}

export interface ResolvedHubConfig extends HubConfig {
  blob: ResolvedBlobConfig | false
  cache: ResolvedCacheConfig | false
  db: ResolvedDatabaseConfig | false
  kv: ResolvedKVConfig | false
  sandbox: ResolvedSandboxConfig | false
  dir: string
}

export interface ModuleRuntimeConfig {
  hub: ResolvedHubConfig
}

export interface ModuleOptions {
  /**
   * Set `true` to enable blob storage with auto-configuration.
   * Or provide a BlobConfig object with driver and connection details.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/blob
   */
  blob?: boolean | BlobConfig
  /**
   * Set `true` to enable caching for the project with auto-configuration.
   * Or provide a CacheConfig object with driver and connection details.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/cache
   */
  cache?: boolean | CacheConfig
  /**
   * Set to `'postgresql'`, `'sqlite'`, or `'mysql'` to use a specific database dialect with a zero-config development database.
   * Or provide a DatabaseConfig object with dialect and connection details.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/database
   */
  db?: 'postgresql' | 'sqlite' | 'mysql' | DatabaseConfig | false
  /**
   * Set `true` to enable the key-value storage with auto-configuration.
   * Or provide a KVConfig object with driver and connection details.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/kv
   */
  kv?: boolean | KVConfig
  /**
   * Set `true` to enable sandbox with auto-configuration.
   * Or provide a SandboxConfig object with provider and options.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/sandbox
   */
  sandbox?: boolean | SandboxConfig
  /**
   * The directory used for storage (database, kv, etc.) during local development.
   * @default '.data'
   */
  dir?: string
  /**
   * The hosting provider that the project is hosted on.
   * This is automatically determined using the NITRO_PRESET or the detected provider during the CI/CD.
   */
  hosting?: string
}

// Blob driver configurations - extend from driver option types
export type FSBlobConfig = { driver: 'fs' } & FSDriverOptions
export type S3BlobConfig = { driver: 's3' } & S3DriverOptions
export type VercelBlobConfig = { driver: 'vercel-blob' } & VercelDriverOptions
export type CloudflareR2BlobConfig = { driver: 'cloudflare-r2', bucketName?: string } & CloudflareDriverOptions

export type BlobConfig = boolean | FSBlobConfig | S3BlobConfig | VercelBlobConfig | CloudflareR2BlobConfig
export type ResolvedBlobConfig = FSBlobConfig | S3BlobConfig | VercelBlobConfig | CloudflareR2BlobConfig

export type CacheConfig = {
  driver?: BuiltinDriverName
  /**
   * Cloudflare KV namespace ID for auto-generating wrangler bindings
   */
  namespaceId?: string
  [key: string]: any
}
export type ResolvedCacheConfig = CacheConfig & {
  driver: BuiltinDriverName
}

export type KVConfig = {
  driver?: BuiltinDriverName
  /**
   * Cloudflare KV namespace ID for auto-generating wrangler bindings
   */
  namespaceId?: string
  [key: string]: any
}

export type ResolvedKVConfig = KVConfig & {
  driver: BuiltinDriverName
}

type DatabaseConnection = {
  /**
   * Database connection URL
   */
  url?: string
  /**
   * Auth token (for Turso/libSQL)
   */
  authToken?: string
  /**
   * Connection string (for PostgreSQL)
   */
  connectionString?: string
  /**
   * Database host
   */
  host?: string
  /**
   * Database port
   */
  port?: number
  /**
   * Database username
   */
  user?: string
  /**
   * Database password
   */
  password?: string
  /**
   * Database name
   */
  database?: string
  /**
   * Cloudflare Account ID (for D1 HTTP driver)
   */
  accountId?: string
  /**
   * Cloudflare API Token (for D1 HTTP driver)
   */
  apiToken?: string
  /**
   * Cloudflare D1 Database ID (for D1 driver and D1 HTTP driver)
   */
  databaseId?: string
  /**
   * Cloudflare Hyperdrive ID for auto-generating wrangler bindings (PostgreSQL/MySQL)
   */
  hyperdriveId?: string
  /**
   * Additional connection options
   */
  [key: string]: any
}

export type DatabaseConfig = {
  /**
   * Database dialect
   */
  dialect: 'sqlite' | 'postgresql' | 'mysql'
  /**
   * Database driver (optional, auto-detected if not provided)
   *
   * SQLite drivers: 'better-sqlite3', 'libsql', 'bun-sqlite', 'd1', 'd1-http'
   * PostgreSQL drivers: 'postgres-js', 'pglite', 'neon-http'
   * MySQL drivers: 'mysql2'
   */
  driver?: 'better-sqlite3' | 'libsql' | 'bun-sqlite' | 'd1' | 'd1-http' | 'postgres-js' | 'pglite' | 'neon-http' | 'mysql2'
  /**
   * Database connection configuration
   */
  connection?: DatabaseConnection
  /**
   * The directories to scan for database migrations.
   * @default ['server/db/migrations']
   */
  migrationsDirs?: string[]
  /**
   * The paths to the SQL queries to apply after the database migrations complete.
   */
  queriesPaths?: string[]
  /**
   * Set `false` to disable applying database migrations during production build time.
   *
   * @default true
   */
  applyMigrationsDuringBuild?: boolean
  /**
   * MySQL mode for Drizzle ORM relational queries.
   * Only applicable when dialect is 'mysql'.
   *
   * @default 'default'
   * @see https://orm.drizzle.team/docs/rqb#modes
   */
  mode?: 'default' | 'planetscale'
  /**
   * Database model naming convention for Drizzle ORM.
   * When set to `'snake_case'`, automatically maps camelCase JavaScript keys to snake_case database column names.
   *
   * @see https://orm.drizzle.team/docs/sql-schema-declaration#camel-and-snake-casing
   */
  casing?: 'snake_case' | 'camelCase'
  /**
   * Read replica connection URLs for PostgreSQL (postgres-js) and MySQL (mysql2) drivers.
   * When configured, read queries are automatically routed to replicas while writes go to the primary.
   *
   * @example
   * ```ts
   * replicas: [process.env.DATABASE_URL_REPLICA_1, process.env.DATABASE_URL_REPLICA_2].filter(Boolean)
   * ```
   *
   * @see https://orm.drizzle.team/docs/read-replicas
   */
  replicas?: string[]
}

export type ResolvedDatabaseConfig = DatabaseConfig & {
  dialect: 'sqlite' | 'postgresql' | 'mysql'
  driver: 'better-sqlite3' | 'libsql' | 'bun-sqlite' | 'd1' | 'd1-http' | 'postgres-js' | 'pglite' | 'neon-http' | 'mysql2'
  connection: DatabaseConnection
  migrationsDirs: string[]
  queriesPaths: string[]
  applyMigrationsDuringBuild: boolean
  casing?: 'snake_case' | 'camelCase'
  replicas?: string[]
}

export type SandboxConfig = {
  /**
   * Sandbox provider. Auto-detected from hosting if not specified.
   */
  provider?: 'vercel' | 'cloudflare'
  /**
   * Runtime environment for the sandbox.
   * @default 'node24' for Vercel
   */
  runtime?: string
  /**
   * Timeout in milliseconds for sandbox operations.
   */
  timeout?: number
  /**
   * Memory allocation in MB.
   */
  memory?: number
  /**
   * CPU allocation.
   */
  cpu?: number
  /**
   * Ports to expose (Vercel only).
   */
  ports?: number[]
  /**
   * Custom sandbox ID (Cloudflare only).
   */
  sandboxId?: string
  /**
   * Cloudflare sandbox options.
   */
  cloudflare?: {
    sleepAfter?: string | number
    keepAlive?: boolean
    normalizeId?: boolean
  }
}

export type ResolvedSandboxConfig = SandboxConfig & {
  provider: 'vercel' | 'cloudflare'
}

// Sandbox runtime types - re-exported from unagent
export type { Sandbox, SandboxOptions, SandboxExecResult, SandboxProvider, SandboxDetectionResult } from 'unagent/sandbox'

export interface HubSandboxOptions {
  /** Durable Object namespace binding (auto-injected from event context) */
  namespace?: unknown
  /** Override provider at runtime */
  provider?: 'vercel' | 'cloudflare'
  /** Custom sandbox ID */
  sandboxId?: string
  /** Runtime (Vercel only) */
  runtime?: string
  /** Timeout in ms (Vercel only) */
  timeout?: number
  /** CPU allocation (Vercel only) */
  cpu?: number
  /** Ports to expose (Vercel only) */
  ports?: number[]
  /** Cloudflare sandbox options */
  cloudflare?: {
    sleepAfter?: string | number
    keepAlive?: boolean
    normalizeId?: boolean
  }
}

/** Create a sandbox instance for running isolated code */
export declare function hubSandbox(options?: HubSandboxOptions): Promise<import('unagent/sandbox').Sandbox>

/** Check if a sandbox provider SDK is available */
export declare function isSandboxAvailable(provider: 'vercel' | 'cloudflare'): boolean

/** Detect current sandbox environment */
export declare function detectSandbox(): import('unagent/sandbox').SandboxDetectionResult
