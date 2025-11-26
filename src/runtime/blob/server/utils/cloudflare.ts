import { createCloudflareAPI, handleCloudflareError } from '../../../utils/cloudflare'
import type { BlobCredentials, BlobCredentialsOptions } from '@nuxthub/core'

/**
 * Create temporary R2 credentials using the Cloudflare API directly
 * This is used when NUXT_HUB_CLOUDFLARE_ACCOUNT_ID, NUXT_HUB_CLOUDFLARE_API_TOKEN, and NUXT_HUB_CLOUDFLARE_BUCKET_ID are set
 *
 * @param accountId - The Cloudflare account ID
 * @param apiToken - The Cloudflare API token with R2 permissions
 * @param bucketId - The R2 bucket ID
 * @param options - Options for creating temporary credentials
 */
export async function createCloudflareR2Credentials(
  accountId: string,
  apiToken: string,
  bucketId: string,
  options: BlobCredentialsOptions = {}
): Promise<BlobCredentials> {
  const $api = createCloudflareAPI(accountId, apiToken)

  const accessKeyId = await $api<any>(`/tokens/verify`)
    .then(res => res?.result?.id)
    .catch(() => null)

  const res = await $api<any>(`/r2/buckets/${bucketId}/temporary-credentials`, {
    method: 'POST',
    body: {
      parentAccessKeyId: accessKeyId,
      ttlSeconds: options.ttl || 900,
      permission: options.permission || 'admin-read-write',
      prefixes: options.prefixes,
      objects: options.pathnames
    },
    onResponseError: ({ response }) => handleCloudflareError({ data: response._data, status: response.status }, 'Failed to create temporary R2 credentials')
  })

  const result = res?.result || res

  return {
    accountId,
    bucketName: result.bucketName || bucketId,
    accessKeyId: result.accessKeyId,
    secretAccessKey: result.secretAccessKey,
    sessionToken: result.sessionToken
  }
}
