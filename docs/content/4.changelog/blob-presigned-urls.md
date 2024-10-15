---
title: Blob Presigned URLs
description: "It is now possible to upload files to your R2 bucket using presigned URLs with zero configuration."
date: 2024-10-15
image: '/images/docs/blob-presigned-urls.png'
authors:
  - name: Sebastien Chopin
    avatar: 
      src: https://avatars.githubusercontent.com/u/904724?v=4
    to: https://x.com/atinux
    username: atinux
---

It is now possible to upload files to your R2 bucket using presigned URLs with zero configuration.

::tip
This feature is available on all [NuxtHub plans](/pricing) and comes with the [v0.7.32](https://github.com/nuxt-hub/core/releases/tag/v0.7.32) release of `@nuxthub/core`.
::

## Why presigned URLs?

By allowing users to upload files to your R2 bucket using presigned URLs, you can:
- Reduce the server load
- Direct client-to-storage uploads, saving bandwidth and costs
- Use a secure and performant way to upload files to your R2 bucket
- By-pass the Workers limitation (100MiB max payload size) using regular upload

## How does it work?

This is a diagrame of the process of creating a presigned URL and uploading a file to R2:

:img{src="/images/docs/blob-presigned-urls.png" alt="NuxtHub presigned URLs to upload files to R2" width="915" height="515" class="rounded"}

In order to create the presigned URL, we created the [`hubBlob().createCredentials()`](/docs/features/blob#createcredentials) method.

This method will create temporary access credentials that can be optionally scoped to prefixes or objects in your bucket.

```ts
const {
  accountId,
  bucketName,
  accessKeyId,
  secretAccessKey,
  sessionToken
} = await hubBlob().createCredentials({
  permission: 'object-read-write',
  pathnames: ['only-this-file.png']
})
```

With these credentials, you can now use the [aws4fetch](https://github.com/mhart/aws4fetch) library to create a presigned URL that can be used to upload a file to R2.

```ts
import { AwsClient } from 'aws4fetch'

// Create the presigned URL
const client = new AwsClient({ accessKeyId, secretAccessKey, sessionToken })
const endpoint = new URL(
  '/only-this-file.png',
  `https://${bucketName}.${accountId}.r2.cloudflarestorage.com`
)
const { url } = await client.sign(endpoint, {
  method: 'PUT',
  aws: { signQuery: true }
})
```

::callout{icon="i-ph-book-open-duotone" to="/docs/features/blob#create-presigned-urls-to-upload-files-to-r2"}
Checkout the example on how to create a presigned URL with NuxtHub.
::

## Alternative

If you don't want to use presigned URLs and want to upload files bigger than 100MiB, you can use the [NuxtHub Multipart Upload](/docs/features/blob#handlemultipartuploadd) feature.
