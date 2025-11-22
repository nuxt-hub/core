import { ofetch } from 'ofetch'
import { createError } from 'h3'
import type { Ai, AiOptions, AutoRAG, AutoRagSearchRequest } from '@cloudflare/workers-types/experimental'

/**
 * Create a Cloudflare AI client that calls the Cloudflare API directly
 * This is used when NUXT_HUB_CLOUDFLARE_ACCOUNT_ID and NUXT_HUB_CLOUDFLARE_API_TOKEN are set
 *
 * @param accountId - The Cloudflare account ID
 * @param apiToken - The Cloudflare API token with Workers AI permissions
 */
export function createCloudflareAI(accountId: string, apiToken: string): Omit<Ai, 'autorag' | 'gateway'> {
  const $api = ofetch.create({
    baseURL: `https://api.cloudflare.com/client/v4/accounts/${accountId}`,
    headers: {
      Authorization: `Bearer ${apiToken}`
    },
    async onResponseError({ response }) {
      if (response.status >= 400) {
        const data = response._data
        throw createError({
          statusCode: response.status || 500,
          statusMessage: 'Cloudflare API error',
          message: data?.errors?.[0]?.message || data?.error?.[0]?.message || 'Detailed error not returned',
          data: data?.errors || data?.error
        })
      }
    }
  })

  return {
    async run(model: string, params?: Record<string, unknown>, options?: AiOptions) {
      const path = `/ai/run/${model}`

      // Handle streaming
      if (params?.stream) {
        return ofetch(path, {
          baseURL: `https://api.cloudflare.com/client/v4/accounts/${accountId}`,
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiToken}`
          },
          responseType: 'stream',
          body: params
        }).catch(async (err) => {
          const data = await err.response?.json?.() || {}
          throw createError({
            statusCode: err.status || 500,
            statusMessage: 'Cloudflare AI API error',
            message: data?.errors?.[0]?.message || data?.error?.[0]?.message || 'Detailed error not returned',
            data: data?.errors || data?.error
          })
        })
      }

      const res = await $api<any>(path, {
        method: 'POST',
        body: params
      })

      return res?.result || res
    },

    async models(params?: Record<string, unknown>) {
      const res = await $api<any>('/ai/models/search', {
        method: 'POST',
        body: params
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
  const $api = ofetch.create({
    baseURL: `https://api.cloudflare.com/client/v4/accounts/${accountId}/autorag/rags/${instance}`,
    headers: {
      Authorization: `Bearer ${apiToken}`
    },
    async onResponseError({ response }) {
      if (response.status >= 400) {
        const data = response._data
        throw createError({
          statusCode: response.status || 500,
          statusMessage: 'Cloudflare API error',
          message: data?.errors?.[0]?.message || data?.error?.[0]?.message || 'Detailed error not returned',
          data: data?.errors || data?.error
        })
      }
    }
  })

  return {
    async aiSearch(params: AutoRagSearchRequest & { stream?: boolean }) {
      // Handle streaming
      if (params?.stream) {
        return ofetch('/ai-search', {
          baseURL: `https://api.cloudflare.com/client/v4/accounts/${accountId}/autorag/rags/${instance}`,
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiToken}`
          },
          responseType: 'stream',
          body: params
        }).catch(async (err) => {
          const data = await err.response?.json?.() || {}
          throw createError({
            statusCode: err.status || 500,
            statusMessage: 'Cloudflare AutoRAG API error',
            message: data?.errors?.[0]?.message || data?.error?.[0]?.message || 'Detailed error not returned',
            data: data?.errors || data?.error
          })
        })
      }

      const res = await $api<any>('/ai-search', {
        method: 'POST',
        body: params
      })

      return res.result
    },

    async search(params: AutoRagSearchRequest) {
      const res = await $api<any>('/search', {
        method: 'POST',
        body: params
      })

      return res.result
    }
  } as AutoRAG
}
