import type { HubConfig } from '~/src/features'

export function getCloudflareAccessHeaders(access: HubConfig['cloudflareAccess']): Record<string, string> {
  const isCloudflareAccessEnabled = !!(access?.clientId && access?.clientSecret)
  if (!isCloudflareAccessEnabled) return {}
  return {
    'CF-Access-Client-Id': access?.clientId,
    'CF-Access-Client-Secret': access?.clientSecret
  }
}
