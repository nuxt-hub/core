const CloudflareTokenPermissions = [
  { key: 'd1', type: 'edit' },
  { key: 'workers_r2', type: 'edit' },
  { key: 'workers_kv_storage', type: 'edit' },
  { key: 'workers_observability', type: 'edit' },
  { key: 'page', type: 'edit' },
  { key: 'workers_scripts', type: 'edit' },
  { key: 'billing', type: 'read' },
  { key: 'account_logs', type: 'edit' },
  { key: 'account_analytics', type: 'read' },
  { key: 'account_settings', type: 'read' },
  { key: 'ai', type: 'read' },
  { key: 'vectorize', type: 'edit' },
  { key: 'aig', type: 'edit' },
  { key: 'rag', type: 'edit' }
]


export default eventHandler(async (event) => {
  return sendRedirect(
    event,
    `https://dash.cloudflare.com/profile/api-tokens?permissionGroupKeys=${JSON.stringify(CloudflareTokenPermissions)}&name=NuxtHub`,
    302
  )
})
