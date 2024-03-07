export function generateWrangler() {
  return `d1_databases = [
  { binding = "DB", database_name = "default", database_id = "default" },
]
kv_namespaces = [
  { binding = "KV", id = "kv_default" },
  { binding = "CACHE", id = "cache_default" },
]
r2_buckets = [
  { binding = "BLOB", bucket_name = "default" },
]
analytics_engine_datasets = [
  { binding = "ANALYTICS", dataset = "default" }
]
`
}
