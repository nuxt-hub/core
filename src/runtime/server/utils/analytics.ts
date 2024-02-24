import type { AnalyticsEngineDataPoint, AnalyticsEngineDataset } from '@cloudflare/workers-types/experimental'
import { ofetch } from 'ofetch'
import { joinURL } from 'ufo'
import { createError } from 'h3'
import { useRuntimeConfig } from '#imports'

const _datasets: Record<string, AnalyticsEngineDataset> = {}

function _useDataset() {
  const name = 'ANALYTICS'
  if (_datasets[name]) {
    return _datasets[name]
  }

  // @ts-ignore
  const binding = process.env[name] || globalThis.__env__?.[name] || globalThis[name]
  if (binding) {
    _datasets[name] = binding as AnalyticsEngineDataset
    return _datasets[name]
  }
  throw createError(`Missing Cloudflare ${name} binding (Analytics Engine)`)
}

export function useAnalytics() {
  const hub = useRuntimeConfig().hub
  if (import.meta.dev && hub.projectUrl) {
    return useProxyAnalytics(hub.projectUrl, hub.projectSecretKey || hub.userToken)
  }
  const dataset = _useDataset()

  return {
    put(data: AnalyticsEngineDataPoint) {
      dataset.writeDataPoint(data)
      return true
    }
  }
}

export function useProxyAnalytics(projectUrl: string, secretKey?: string) {
  const analyticsAPI = ofetch.create({
    baseURL: joinURL(projectUrl, '/api/_hub/analytics'),
    headers: {
      Authorization: `Bearer ${secretKey}`
    }
  })

  return {
    async put(data: AnalyticsEngineDataPoint) {
      return analyticsAPI<boolean>('/', {
        method: 'PUT',
        body: { data }
      })
    }
  }
}
