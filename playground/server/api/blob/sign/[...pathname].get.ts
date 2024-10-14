import { AwsClient } from 'aws4fetch'

/*
** Create a signed url to upload a file to R2
** https://developers.cloudflare.com/r2/api/s3/presigned-urls/#presigned-url-alternative-with-workers
*/
export default eventHandler(async (event) => {
  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)
  const { accountId, bucketName, ...credentials } = await hubBlob().createCredentials({
    permission: 'object-read-write',
    pathnames: [pathname]
  })
  const client = new AwsClient(credentials)
  const endpoint = new URL(pathname, `https://${bucketName}.${accountId}.r2.cloudflarestorage.com`)

  const { url } = await client.sign(endpoint, {
    method: 'PUT',
    aws: { signQuery: true }
  })
  return url
})
