import type { BuiltinDriverName } from 'unstorage'

export interface HubConfig {
  blob: boolean | BlobConfig
  cache: boolean | CacheConfig
  db: false | 'postgresql' | 'sqlite' | 'mysql' | DatabaseConfig
  kv: boolean | KVConfig
  dir: string
  hosting: string
}

export interface ResolvedHubConfig extends HubConfig {
  blob: ResolvedBlobConfig | false
  cache: ResolvedCacheConfig | false
  db: ResolvedDatabaseConfig | false
  kv: ResolvedKVConfig | false
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
   * @see https://hub.nuxt.com/docs/features/blob
   */
  blob?: boolean | BlobConfig
  /**
   * Set `true` to enable caching for the project with auto-configuration.
   * Or provide a CacheConfig object with driver and connection details.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/features/cache
   */
  cache?: boolean | CacheConfig
  /**
   * Set to `'postgresql'`, `'sqlite'`, or `'mysql'` to use a specific database dialect with a zero-config development database.
   * Or provide a DatabaseConfig object with dialect and connection details.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/features/database
   */
  db?: 'postgresql' | 'sqlite' | 'mysql' | DatabaseConfig | false
  /**
   * Set `true` to enable the key-value storage with auto-configuration.
   * Or provide a KVConfig object with driver and connection details.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/features/kv
   */
  kv?: boolean | KVConfig
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

export interface BlobConfig {
  driver?: BuiltinDriverName | string
  [key: string]: any
}

export interface ResolvedBlobConfig extends BlobConfig {
  driver: BuiltinDriverName | string
}
export interface CacheConfig {
  driver?: BuiltinDriverName | string
  [key: string]: any
}

export interface ResolvedCacheConfig extends CacheConfig {
  driver: BuiltinDriverName | string
}

export interface KVConfig {
  driver?: BuiltinDriverName
  [key: string]: any
}

export interface ResolvedKVConfig extends KVConfig {
  driver: BuiltinDriverName
}

interface DatabaseConnection {
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
   * Cloudflare D1 Database ID (for D1 HTTP driver)
   */
  databaseId?: string
  /**
   * Additional connection options
   */
  [key: string]: any
}

export interface DatabaseConfig {
  /**
   * Database dialect
   */
  dialect: 'sqlite' | 'postgresql' | 'mysql'
  /**
   * Database driver (optional, auto-detected if not provided)
   *
   * SQLite drivers: 'better-sqlite3', 'libsql', 'bun-sqlite', 'd1', 'd1-http'
   * PostgreSQL drivers: 'postgres-js', 'pglite'
   * MySQL drivers: 'mysql2'
   */
  driver?: 'better-sqlite3' | 'libsql' | 'bun-sqlite' | 'd1' | 'd1-http' | 'postgres-js' | 'pglite' | 'mysql2'
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
}

export interface ResolvedDatabaseConfig extends DatabaseConfig {
  dialect: 'sqlite' | 'postgresql' | 'mysql'
  driver: 'better-sqlite3' | 'libsql' | 'bun-sqlite' | 'd1' | 'd1-http' | 'postgres-js' | 'pglite' | 'mysql2'
  connection: DatabaseConnection
  migrationsDirs: string[]
  queriesPaths: string[]
  applyMigrationsDuringBuild: boolean
}
