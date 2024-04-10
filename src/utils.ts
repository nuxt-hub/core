import { addCustomTab } from '@nuxt/devtools-kit'
import type { Nuxt } from 'nuxt/schema'

export interface DeployConfig {
  name: string,
  analytics?: string,
  blob?: string,
  cache?: string,
  database?: string,
  kv?: string,
  vars: Record<string, string>
}

export function generateWrangler(hub: { kv: boolean, database: boolean, blob: boolean, cache: boolean, analytics: boolean }) {
  return [
    hub.analytics ? [
      'analytics_engine_datasets = [',
      '  { binding = "ANALYTICS", dataset = "default" }',
      ']',
    ] : [],
    hub.blob ? [
      'r2_buckets = [',
      '  { binding = "BLOB", bucket_name = "default" }',
      ']'
    ] : [],
    hub.cache || hub.kv ? [
      'kv_namespaces = [',
      hub.kv    ? '  { binding = "KV", id = "kv_default" },' : '',
      hub.cache ? '  { binding = "CACHE", id = "cache_default" },' : '',
      ']',
    ] : [],
    hub.database ? [
      'd1_databases = [',
      '  { binding = "DB", database_name = "default", database_id = "default" }',
      ']'
    ] : [],
  ].flat().join('\n')
}

export function generateWranglerForPages(env: 'preview' | 'production', deployConfig: DeployConfig) {
  return [
    `name = "${deployConfig.name}"`,
    'compatibility_date = "2024-04-05"',
    'pages_build_output_dir = "./dist"',
    'compatibility_flags = [ "nodejs_compat" ]',

    deployConfig.vars && Object.keys(deployConfig.vars).length > 0 ? [
      `[env.${env}.vars]`,
      ...Object.entries(deployConfig.vars).map(([key, value]) => `${key} = "${value}"`),
      '',
    ] : [],
    deployConfig.analytics ? [
      `[[env.${env}.analytics_engine_datasets]]`,
      'binding = "ANALYTICS"',
      `dataset = "${deployConfig.analytics}"`
    ] : [],
    '',
    deployConfig.blob ? [
      `[[env.${env}.r2_buckets]]`,
      'binding = "BLOB"',
      `bucket_name = "${deployConfig.blob}"`,
    ] : [],
    '',
    deployConfig.cache ? [
      `[[env.${env}.kv_namespaces]]`,
      'binding = "CACHE"',
      `id = "${deployConfig.cache}"`,
    ]: [],
    '',
    deployConfig.database ? [
      `[[env.${env}.d1_databases]]`,
      `database_id = "${deployConfig.database}"`,
      'binding = "DB"',
      'database_name = "DB"',
    ] : [],
    '',
    deployConfig.kv ? [
      `[[env.${env}.kv_namespaces]]`,
      'binding = "KV"',
      `id = "${deployConfig.kv}"`,
    ]: [],
  ].flat().join('\n')
}

export function addDevtoolsCustomTabs(nuxt: Nuxt, hub: { kv: boolean, database: boolean, blob: boolean }) {
  nuxt.hook('listen', (_, { url }) => {
    hub.database && addCustomTab({
      category: 'server',
      name: 'hub-database',
      title: 'Hub Database',
      icon: 'i-ph-database',
      view: {
        type: 'iframe',
        src: `https://admin.hub.nuxt.com/embed/database?url=${url}`,
      },
    })

    hub.kv && addCustomTab({
      category: 'server',
      name: 'hub-kv',
      title: 'Hub KV',
      icon: 'i-ph-coin',
      view: {
        type: 'iframe',
        src: `https://admin.hub.nuxt.com/embed/kv?url=${url}`,
      },
    })

    hub.blob && addCustomTab({
      category: 'server',
      name: 'hub-blob',
      title: 'Hub Blob',
      icon: 'i-ph-shapes',
      view: {
        type: 'iframe',
        src: `https://admin.hub.nuxt.com/embed/blob?url=${url}`,
      },
    })
  })
}