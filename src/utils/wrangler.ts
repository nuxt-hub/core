import { stringifyTOML } from 'confbox'

export function generateWrangler(hub: { kv: boolean, database: boolean, blob: boolean, analytics: boolean, ai: boolean, accountId?: string, vectorize: boolean }) {
  const wrangler: { [key: string]: any } = {}

  if (hub.accountId) {
    wrangler['account_id'] = hub.accountId
  }

  if (hub.ai) {
    wrangler['ai'] = {
      binding: 'AI'
    }
  }

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

  if (hub.vectorize) {
    wrangler['vectorize'] = [{
      binding: 'VECTORIZE',
      index_name: 'default',
    }]
  }

  return stringifyTOML(wrangler)
}
