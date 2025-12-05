import type { BuiltinDriverName } from 'unstorage'

export interface KVConfig {
  driver?: BuiltinDriverName
  [key: string]: any
}

export interface ResolvedKVConfig extends KVConfig {
  driver: BuiltinDriverName
}
