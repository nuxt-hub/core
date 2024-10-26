import type { AnalyticsEngineDataPoint, AnalyticsEngineDataset } from '@cloudflare/workers-types/experimental'
import { ofetch } from 'ofetch'
import { joinURL } from 'ufo'
import { createError } from 'h3'
import { requireNuxtHubFeature } from '../../../utils/features'
import { useRuntimeConfig } from '#imports'

const _datasets: Record<string, AnalyticsEngineDataset> = {}

function getAnalyticsBinding(name: string = 'ANALYTICS'): AnalyticsEngineDataset | undefined {
  // @ts-expect-error globalThis.__env__ is injected by the runtime
  return process.env[name] || globalThis.__env__?.[name] || globalThis[name]
}

function _useDataset(name: string = 'ANALYTICS'): AnalyticsEngineDataset {
  if (_datasets[name]) {
    return _datasets[name] as AnalyticsEngineDataset
  }

  const binding = getAnalyticsBinding()
  if (binding) {
    _datasets[name] = binding
    return _datasets[name] as AnalyticsEngineDataset
  }
  throw createError(`Missing Cloudflare ${name} binding (Analytics Engine)`)
}

/**
 * Access the Workers Analytics Engine
 *
 * @example ```ts
 * const analytics = hubAnalytics()
 * await analytics.put({
 *   blobs: ['Seattle', 'USA', 'pro_sensor_9000'],
 *   doubles: [1.1, 2.2, 3.3],
 *   indexes: ['a3cd45']
 * })
 * ```
 *
 * @see https://developers.cloudflare.com/analytics/analytics-engine/get-started/
 */
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

export function proxyHubAnalytics(projectUrl: string, secretKey?: string, headers?: HeadersInit) {
  requireNuxtHubFeature('analytics')

  const analyticsAPI = ofetch.create({
    baseURL: joinURL(projectUrl, '/api/_hub/analytics'),
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...headers
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
