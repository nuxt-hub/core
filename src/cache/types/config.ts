import type { BuiltinDriverName } from 'unstorage'

export interface CacheConfig {
  driver?: BuiltinDriverName | string
  [key: string]: any
}

export interface ResolvedCacheConfig extends CacheConfig {
  driver: BuiltinDriverName | string
}
