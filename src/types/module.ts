import type { BuiltinDriverName } from 'unstorage'
import type { DatabaseConfig, ResolvedDatabaseConfig } from '../db/types'

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

export interface HubConfig {
  blob: boolean | BlobConfig
  cache: boolean | CacheConfig
  db: false | 'postgresql' | 'sqlite' | 'mysql' | DatabaseConfig
  kv: boolean | KVConfig
  dir: string
  hosting: string
}

export interface ResolvedHubConfig extends HubConfig {
  blob: BlobConfig | false
  cache: CacheConfig | false
  db: ResolvedDatabaseConfig | false
  kv: KVConfig | false
  dir: string
}

declare module 'nuxt/schema' {
  interface RuntimeConfig {
    hub: ResolvedHubConfig
  }
}
