import type { AnalyticsEngineDataPoint, AnalyticsEngineDataset } from '@cloudflare/workers-types/experimental'
import { ofetch } from 'ofetch'
import { joinURL } from 'ufo'
import { createError } from 'h3'
import { requireNuxtHubFeature } from './features'
import { useRuntimeConfig } from '#imports'

const _datasets: Record<string, AnalyticsEngineDataset> = {}

function getAnalyticsBinding(name: string = 'ANALYTICS') {
  // @ts-expect-error globalThis.__env__ is injected by the runtime
  return process.env[name] || globalThis.__env__?.[name] || globalThis[name]
}

function _useDataset(name: string = 'ANALYTICS') {
  if (_datasets[name]) {
    return _datasets[name]
  }

  const binding = getAnalyticsBinding()
  if (binding) {
    _datasets[name] = binding as AnalyticsEngineDataset
    return _datasets[name]
  }
  throw createError(`Missing Cloudflare ${name} binding (Analytics Engine)`)
}

export function hubAnalytics() {
  requireNuxtHubFeature('analytics')

  const hub = useRuntimeConfig().hub
  const binding = getAnalyticsBinding()
  if (hub.remote && hub.projectUrl && !binding) {
    return proxyHubAnalytics(hub.projectUrl, hub.projectSecretKey || hub.userToken)
  }
  const dataset = _useDataset()

  return {
    put(data: AnalyticsEngineDataPoint) {
      dataset.writeDataPoint(data)
      return true
    }
  }
}

export function proxyHubAnalytics(projectUrl: string, secretKey?: string) {
  requireNuxtHubFeature('analytics')

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
