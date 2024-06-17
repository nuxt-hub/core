import { stringifyTOML } from 'confbox'

export function generateWrangler(hub: { kv: boolean, database: boolean, blob: boolean, analytics: boolean }) {
  const wrangler: { [key: string]: any } = {}

  if (hub.analytics) {
    wrangler['analytics_engine_datasets'] = [{
      binding: 'ANALYTICS',
      dataset: 'default'
    }]
  }

  if (hub.blob) {
    wrangler['r2_buckets'] = [{
      binding: 'BLOB',
      bucket_name: 'default'
    }]
  }

  if (hub.kv) {
    wrangler['kv_namespaces'] = [{
      binding: 'KV',
      id: 'kv_default'
    }]
  }

  if (hub.database) {
    wrangler['d1_databases'] = [{
      binding: 'DB',
      database_name: 'default',
      database_id: 'default'
    }]
  }

  return stringifyTOML(wrangler)
}
