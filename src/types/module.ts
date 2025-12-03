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

export interface ModuleRuntimeConfig {
  hub: ResolvedHubConfig
}
