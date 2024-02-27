export function generateWrangler() {
  return `d1_databases = [
  { binding = "DB", database_name = "default", database_id = "default" },
]
kv_namespaces = [
  { binding = "KV", id = "user_default" },
  { binding = "CONFIG", id = "config_default" },
]
r2_buckets = [
  { binding = "BLOB", bucket_name = "default" },
]
analytics_engine_datasets = [
  { binding = "ANALYTICS", dataset = "default" }
]
`
}
