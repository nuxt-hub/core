import { createCloudflareAPI, handleCloudflareError } from '../../../utils/cloudflare'

/**
 * Delete multiple keys from a KV namespace using the Cloudflare API directly
 * This is used when NUXT_HUB_CLOUDFLARE_ACCOUNT_ID, NUXT_HUB_CLOUDFLARE_API_TOKEN, and NUXT_HUB_CLOUDFLARE_CACHE_NAMESPACE_ID are set
 *
 * @param accountId - The Cloudflare account ID
 * @param apiToken - The Cloudflare API token with KV permissions
 * @param namespaceId - The KV namespace ID
 * @param keys - Array of keys to delete (max 10,000 per call)
 */
export async function bulkDeleteCacheKeys(
  accountId: string,
  apiToken: string,
  namespaceId: string,
  keys: string[]
): Promise<void> {
  const $api = createCloudflareAPI(accountId, apiToken)

  // Cloudflare KV bulk delete accepts up to 10,000 keys per request
  // Split into chunks of 10,000 if needed
  for (let i = 0; i < keys.length; i += 10000) {
    const chunk = keys.slice(i, i + 10000)
    await $api(`/storage/kv/namespaces/${namespaceId}/bulk/delete`, {
      method: 'POST',
      body: chunk,
      onResponseError: ({ response }) => handleCloudflareError({ data: response._data, status: response.status }, 'Failed to delete cache keys')
    })
  }
}
