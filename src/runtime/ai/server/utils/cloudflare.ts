import { createError } from 'h3'
import type { Ai, AiOptions, AutoRAG, AutoRagSearchRequest } from '@cloudflare/workers-types/experimental'
import { createCloudflareAPI, handleCloudflareError } from '../../../utils/cloudflare'

/**
 * Create a Cloudflare AI client that calls the Cloudflare API directly
 * This is used when NUXT_HUB_CLOUDFLARE_ACCOUNT_ID and NUXT_HUB_CLOUDFLARE_API_TOKEN are set
 *
 * @param accountId - The Cloudflare account ID
 * @param apiToken - The Cloudflare API token with Workers AI permissions
 */
export function createCloudflareAI(accountId: string, apiToken: string): Omit<Ai, 'autorag' | 'gateway'> {
  const $api = createCloudflareAPI(accountId, apiToken)

  return {
    aiGatewayLogId: null,
    async run(model: string, params?: Record<string, unknown>, _options?: AiOptions) {
      const path = `/ai/run/${model}`

      // Handle streaming
      if (params?.stream) {
        return $api<any>(path, {
          method: 'POST',
          body: params,
          // @ts-expect-error - responseType 'stream' is valid but not in ofetch types
          responseType: 'stream',
          onResponseError: ({ response }) => handleCloudflareError({ data: response._data, status: response.status }, 'Cloudflare AI API error')
        })
      }

      const res = await $api<any>(path, {
        method: 'POST',
        body: params,
        onResponseError: ({ response }) => handleCloudflareError({ data: response._data, status: response.status }, 'Cloudflare AI API error')
      })

      return res?.result || res
    },

    async models(params?: Record<string, unknown>) {
      const res = await $api<any>('/ai/models/search', {
        method: 'POST',
        body: params,
        onResponseError: ({ response }) => handleCloudflareError({ data: response._data, status: response.status }, 'Cloudflare AI API error')
      })

      return res.result
    },

    async toMarkdown(_files: unknown, _options: unknown) {
      throw createError({
        statusCode: 501,
        message: 'hubAI().toMarkdown() is not supported when using direct Cloudflare API. Use remote storage or the NuxtHub Admin instead.'
      })
    }
  } as Omit<Ai, 'autorag' | 'gateway'>
}

/**
 * Create a Cloudflare AutoRAG client that calls the Cloudflare API directly
 *
 * @param instance - The AutoRAG instance name
 * @param accountId - The Cloudflare account ID
 * @param apiToken - The Cloudflare API token with Workers AI permissions
 */
export function createCloudflareAutoRAG(instance: string, accountId: string, apiToken: string): AutoRAG {
  const $api = createCloudflareAPI(accountId, apiToken, `/autorag/rags/${instance}`)

  return {
    async aiSearch(params: AutoRagSearchRequest & { stream?: boolean }) {
      // Handle streaming
      if (params?.stream) {
        return $api<any>('/ai-search', {
          method: 'POST',
          body: params,
          // @ts-expect-error - responseType 'stream' is valid but not in ofetch types
          responseType: 'stream',
          onResponseError: ({ response }) => handleCloudflareError({ data: response._data, status: response.status }, 'Cloudflare AutoRAG API error')
        })
      }

      const res = await $api<any>('/ai-search', {
        method: 'POST',
        body: params,
        onResponseError: ({ response }) => handleCloudflareError({ data: response._data, status: response.status }, 'Cloudflare AutoRAG API error')
      })

      return res.result
    },

    async search(params: AutoRagSearchRequest) {
      const res = await $api<any>('/search', {
        method: 'POST',
        body: params,
        onResponseError: ({ response }) => handleCloudflareError({ data: response._data, status: response.status }, 'Cloudflare AutoRAG API error')
      })

      return res.result
    }
  } as AutoRAG
}
