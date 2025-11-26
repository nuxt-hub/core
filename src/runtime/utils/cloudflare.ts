import { ofetch } from 'ofetch'
import { createError } from 'h3'

/**
 * Create a configured ofetch client for Cloudflare API calls
 *
 * @param accountId - The Cloudflare account ID
 * @param apiToken - The Cloudflare API token
 * @param basePath - Optional path to append to the base URL (e.g., '/ai', '/autorag/rags/instance')
 */
export function createCloudflareAPI(
  accountId: string,
  apiToken: string,
  basePath: string = ''
) {
  return ofetch.create({
    baseURL: `https://api.cloudflare.com/client/v4/accounts/${accountId}${basePath}`,
    headers: {
      Authorization: `Bearer ${apiToken}`
    }
  })
}

/**
 * Handle Cloudflare API errors
 * Extract error message from Cloudflare API response
 */
export function handleCloudflareError(err: any, defaultMessage: string = 'Cloudflare API error') {
  const data = err.data || err.response?._data || {}
  throw createError({
    statusCode: err.status || err.statusCode || 500,
    statusMessage: defaultMessage,
    message: data?.errors?.[0]?.message || data?.error?.[0]?.message || 'Detailed error not returned',
    data: data?.errors || data?.error
  })
}
