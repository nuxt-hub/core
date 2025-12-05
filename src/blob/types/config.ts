import type { BuiltinDriverName } from 'unstorage'

export interface BlobConfig {
  driver?: BuiltinDriverName | string
  [key: string]: any
}

export interface ResolvedBlobConfig extends BlobConfig {
  driver: BuiltinDriverName | string
}
