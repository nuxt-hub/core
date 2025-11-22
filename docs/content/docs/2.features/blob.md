---
title: Blob Storage
navigation.title: Blob
description: Upload, store and serve images, videos, music, documents and other unstructured data in your Nuxt application.
---

## Getting Started

Enable the blob storage in your NuxtHub project by adding the `blob` property to the `hub` object in your `nuxt.config.ts` file.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    blob: true
  }
})
```

::note
This option will use Cloudflare platform proxy in development and automatically create a [Cloudflare R2](https://developers.cloudflare.com/r2) bucket for your project when you [deploy it](/docs/getting-started/deploy).
::

::tabs
::div{label="Nuxt DevTools"}
:img{src="/images/landing/nuxt-devtools-blob.png" alt="Nuxt DevTools Blob" width="915" height="515"}
::
::div{label="NuxtHub Admin"}
:img{src="/images/landing/nuxthub-admin-blob.png" alt="NuxtHub Admin Blob" width="915" height="515"}
::
::

## `hubBlob()`

Server composable that returns a set of methods to manipulate the blob storage.

### `list()`

Returns a paginated list of blobs (metadata only).

```ts [server/api/files.get.ts]
export default eventHandler(async () => {
  const { blobs } = await hubBlob().list({ limit: 10 })

  return blobs
})
```

#### Params

::field-group
  ::field{name="options" type="Object"}
    The list options.
    ::collapsible
      ::field{name="limit" type="Number"}
        The maximum number of blobs to return per request. Defaults to `1000`.
      ::
      ::field{name="prefix" type="String"}
        Filters the results to only those that begin with the specified prefix.
      ::
      ::field{name="cursor" type="String"}
        The cursor to continue from a previous list operation.
      ::
      ::field{name="folded" type="Boolean"}
        If `true`, the list will be folded using `/` separator and list of folders will be returned.
      ::
    ::
  ::
::

#### Return

Returns [`BlobListResult`](#bloblistresult).

#### Return all blobs

To fetch all blobs, you can use a `while` loop to fetch the next page until the `cursor` is `null`. 

```ts
let blobs = []
let cursor = null

do {
  const res = await hubBlob().list({ cursor })
  blobs.push(...res.blobs)
  cursor = res.cursor
} while (cursor)
```

### `serve()`

Returns a blob's data and sets `Content-Type`, `Content-Length` and `ETag` headers.

::code-group
```ts [server/routes/images/[...pathname\\].get.ts]
export default eventHandler(async (event) => {
  const { pathname } = getRouterParams(event)

  return hubBlob().serve(event, pathname)
})
```
```vue [pages/index.vue]
<template>
  <img src="/images/my-image.jpg">
</template>
```
::

::important
To prevent XSS attacks, make sure to control the Content type of the blob you serve.
::

You can also set a `Content-Security-Policy` header to add an additional layer of security:

```ts [server/api/images/[...pathname\\].get.ts]
export default eventHandler(async (event) => {
  const { pathname } = getRouterParams(event)

  setHeader(event, 'Content-Security-Policy', 'default-src \'none\';')
  return hubBlob().serve(event, pathname)
})
```

#### Params

::field-group
  ::field{name="event" type="H3Event"}
    Handler's event, needed to set headers.
  ::
  ::field{name="pathname" type="String"}
    The name of the blob to serve.
  ::
::

#### Return

Returns the blob's raw data and sets `Content-Type` and `Content-Length` headers.

### `head()`

Returns a blob's metadata.

```ts
const metadata = await hubBlob().head(pathname)
```

#### Params

::field-group
  ::field{name="pathname" type="String"}
    The name of the blob to serve.
  ::
::

#### Return

Returns a [`BlobObject`](#blobobject).


### `get()`

Returns a blob body.

```ts
const blob = await hubBlob().get(pathname)
```

#### Params

::field-group
  ::field{name="pathname" type="String"}
    The name of the blob to serve.
  ::
::

#### Return

Returns a [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) or `null` if not found.

### `put()`

Uploads a blob to the storage.

```ts [server/api/files.post.ts]
export default eventHandler(async (event) => {
  const form = await readFormData(event)
  const file = form.get('file') as File

  if (!file || !file.size) {
    throw createError({ statusCode: 400, message: 'No file provided' })
  }

  ensureBlob(file, {
    maxSize: '1MB',
    types: ['image']
  })

  return hubBlob().put(file.name, file, {
    addRandomSuffix: false,
    prefix: 'images'
  })
})
```

See an example on the Vue side:

```vue [pages/upload.vue]
<script setup lang="ts">
async function uploadImage (e: Event) {
  const form = e.target as HTMLFormElement

  await $fetch('/api/files', {
    method: 'POST',
    body: new FormData(form)
  }).catch((err) => alert('Failed to upload image:\n'+ err.data?.message))

  form.reset()
}
</script>

<template>
  <form @submit.prevent="uploadImage">
    <label>Upload an image: <input type="file" name="image"></label>
    <button type="submit">
      Upload
    </button>
  </form>
</template>
```

#### Params

::field-group
  ::field{name="pathname" type="String"}
    The name of the blob to serve.
  ::
  ::field{name="body" type="String | ReadableStream<any> | ArrayBuffer | ArrayBufferView | Blob"}
    The blob's data.
  ::
  ::field{name="options" type="Object"}
    The put options. Any other provided field will be stored in the blob's metadata.
    ::collapsible
      ::field{name="contentType" type="String"}
        The content type of the blob. If not given, it will be inferred from the Blob or the file extension.
      ::
      ::field{name="contentLength" type="String"}
        The content length of the blob.
      ::
      ::field{name="addRandomSuffix" type="Boolean"}
        If `true`, a random suffix will be added to the blob's name. Defaults to `false`.
      ::
      ::field{name="prefix" type="string"}
        The prefix to use for the blob pathname.
      ::
      ::field{name="customMetadata" type="Record<string, string>"}
        An object with custom metadata to store with the blob.
      ::
    ::
  ::
::

#### Return

Returns a [`BlobObject`](#blobobject).

### `del()`

Delete a blob with its pathname.

```ts [server/api/files/[...pathname\\].delete.ts]
export default eventHandler(async (event) => {
  const { pathname } = getRouterParams(event)

  await hubBlob().del(pathname)

  return sendNoContent(event)
})
```

You can also delete multiple blobs at once by providing an array of pathnames:

```ts
await hubBlob().del(['images/1.jpg', 'images/2.jpg'])
```

::note
You can also use the `delete()` method as alias of `del()`.
::

#### Params

::field-group
  ::field{name="pathname" type="String"}
    The name of the blob to serve.
  ::
::

#### Return

Returns nothing.

### `handleUpload()`

This is an "all in one" function to validate a `Blob` by checking its size and type and upload it to the storage.

::note
This server util is made to be used with the [`useUpload()`](#useupload) Vue composable.
::

It can be used to handle file uploads in API routes.

::code-group
```ts [server/api/blob.put.ts]
export default eventHandler(async (event) => {
  return hubBlob().handleUpload(event, {
    formKey: 'files', // read file or files form the `formKey` field of request body (body should be a `FormData` object)
    multiple: true, // when `true`, the `formKey` field will be an array of `Blob` objects
    ensure: {
      types: ['image/jpeg', 'image/png'], // allowed types of the file
    },
    put: {
      addRandomSuffix: true
    }
  })
})
```
```vue [pages/upload.vue]
<script setup lang="ts">
const upload = useUpload('/api/blob', { method: 'PUT' })

async function onFileSelect(event: Event) {
  const uploadedFiles = await upload(event.target as HTMLInputElement)
  // file uploaded successfully
}
</script>

<template>
  <input type="file" name="file" @change="onFileSelect" multiple accept="image/jpeg, image/png" />
</template>
```
::

#### Params

::field-group
  ::field{name="formKey" type="string"}
    The form key to read the file from. Defaults to `'files'`.
  ::
  ::field{name="multiple" type="boolean"}
    When `true`, the `formKey` field will be an array of `Blob` objects.
  ::
  ::field{name="ensure" type="BlobEnsureOptions"}
    See [`ensureBlob()`](#ensureblob) options for more details.
  ::
  ::field{name="put" type="BlobPutOptions"}
    See [`put()`](#put) options for more details.
  ::
::

#### Return

Returns a [`BlobObject`](#blobobject) or an array of [`BlobObject`](#blobobject) if `multiple` is `true`.

Throws an error if `file` doesn't meet the requirements.

### `handleMultipartUpload()`

Handle the request to support multipart upload.

```ts [server/api/files/multipart/[action\\]/[...pathname\\].ts]
export default eventHandler(async (event) => {
  return await hubBlob().handleMultipartUpload(event)
})
```

::important
Make sure your route includes `[action]` and `[...pathname]` params.
::

On the client side, you can use the `useMultipartUpload()` composable to upload a file in parts.

```vue
<script setup lang="ts">
async function uploadFile(file: File) {
  const upload = useMultipartUpload('/api/files/multipart')

  const { progress, completed, abort } = upload(file)
}
</script>
```

::note{to="#usemultipartupload"}
See [`useMultipartUpload()`](#usemultipartupload) on usage details.
::

#### Params

::field-group
  ::field{name="contentType" type="string"}
    The content type of the blob.
  ::
  ::field{name="contentLength" type="string"}
    The content length of the blob.
  ::
  ::field{name="addRandomSuffix" type="boolean"}
    If `true`, a random suffix will be added to the blob's name. Defaults to `false`.
  ::
::

### `createMultipartUpload()`

::note
We suggest to use [`handleMultipartUpload()`](#handlemultipartupload) method to handle the multipart upload request.
::

Start a new multipart upload.

```ts [server/api/files/multipart/[...pathname\\].post.ts]
export default eventHandler(async (event) => {
  const { pathname } = getRouterParams(event)

  const mpu = await hubBlob().createMultipartUpload(pathname)

  return {
    uploadId: mpu.uploadId,
    pathname: mpu.pathname,
  }
})
```

#### Params

::field-group
  ::field{name="pathname" type="String"}
    The name of the blob to serve.
  ::
  ::field{name="options" type="Object"}
    The put options. Any other provided field will be stored in the blob's metadata.
    ::collapsible
      ::field{name="contentType" type="String"}
        The content type of the blob. If not given, it will be inferred from the Blob or the file extension.
      ::
      ::field{name="contentLength" type="String"}
        The content length of the blob.
      ::
      ::field{name="addRandomSuffix" type="Boolean"}
        If `true`, a random suffix will be added to the blob's name. Defaults to `true`.
      ::
    ::
  ::
::

#### Return

Returns a `BlobMultipartUpload`

### `resumeMultipartUpload()`

::note
We suggest to use [`handleMultipartUpload()`](#handlemultipartupload) method to handle the multipart upload request.
::

Continue processing of unfinished multipart upload.

To upload a part of the multipart upload, you can use the `uploadPart()` method:

```ts [server/api/files/multipart/[...pathname\\].put.ts]
export default eventHandler(async (event) => {
  const { pathname } = getRouterParams(event)
  const { uploadId, partNumber } = getQuery(event)

  const stream = getRequestWebStream(event)!
  const body = await streamToArrayBuffer(stream, contentLength)

  const mpu = hubBlob().resumeMultipartUpload(pathname, uploadId)
  return await mpu.uploadPart(partNumber, body)
})
```

Complete the upload by calling `complete()` method:

```ts [server/api/files/multipart/complete.post.ts]
export default eventHandler(async (event) => {
  const { pathname, uploadId } = getQuery(event)
  const parts = await readBody(event)

  const mpu = hubBlob().resumeMultipartUpload(pathname, uploadId)
  return await mpu.complete(parts)
})
```

If you want to cancel the upload, you need to call `abort()` method: 

```ts [server/api/files/multipart/[...pathname\\].delete.ts]
export default eventHandler(async (event) => {
  const { pathname } = getRouterParams(event)
  const { uploadId } = getQuery(event)

  const mpu = hubBlob().resumeMultipartUpload(pathname, uploadId)
  await mpu.abort()

  return sendNoContent(event)
})
```

A simple example of multipart upload in client with above routes:

```ts [utils/multipart-upload.ts]
async function uploadLargeFile(file: File) {
  const chunkSize = 10 * 1024 * 1024 // 10MB

  const count = Math.ceil(file.size / chunkSize)
  const { pathname, uploadId } = await $fetch(
    `/api/files/multipart/${file.name}`,
    { method: 'POST' },
  )

  const uploaded = []

  for (let i = 0; i < count; i++) {
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    const partNumber = i + 1
    const chunk = file.slice(start, end)

    const part = await $fetch(
      `/api/files/multipart/${pathname}`,
      {
        method: 'PUT',
        query: { uploadId, partNumber },
        body: chunk,
      },
    )

    uploaded.push(part)
  }

  return await $fetch(
    '/api/files/multipart/complete',
    {
      method: 'POST',
      query: { pathname, uploadId },
      body: { parts: uploaded },
    },
  )
}
```

#### Params

::field-group
  ::field{name="pathname" type="String"}
    The name of the blob to serve.
  ::
  ::field{name="uploadId" type="String"}
    The upload ID of the multipart upload.
  ::
::

#### Return

Returns a `BlobMultipartUpload`


#### Params

::field-group
  ::field{name="event" type="H3Event" required}
    The event to handle.
  ::
::


### `createCredentials()`

Creates temporary access credentials that can be optionally scoped to prefixes or objects.

Useful to create presigned URLs to upload files to R2 from client-side ([see example](#create-presigned-urls-to-upload-files-to-r2)).

::note
This method is only available in production or in development with `--remote` flag.
::

```ts
// Create credentials with default permission & scope (admin-read-write)
const credentials = await hubBlob().createCredentials()

// Limit the scope to a specific object & permission
const credentials = await hubBlob().createCredentials({
  permission: 'object-read-write',
  pathnames: ['only-this-file.png']
})
```

Read more about [creating presigned URLs to upload files to R2](#create-presigned-urls-to-upload-files-to-r2).

#### Self-hosted

When self-hosting your application, you can use your own Cloudflare credentials to create temporary R2 credentials without going through NuxtHub Admin.

Set the following environment variables in your project:

```bash
NUXT_HUB_CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
NUXT_HUB_CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
NUXT_HUB_CLOUDFLARE_BUCKET_ID=your-r2-bucket-id
```

::tip
You can find your R2 bucket ID in the [Cloudflare Dashboard](https://dash.cloudflare.com) under **R2** → Your Bucket → **Settings** → **Bucket Details**.
::

::note
The API token needs to have **R2 Read and Write** permissions for the bucket.
::

#### Params

::field-group
  ::field{name="options" type="Object"}
    The options to create the credentials.
    ::collapsible
      ::field{name="permission" type="string"}
        The permission of the credentials, defaults to `'admin-read-write'`{lang=ts}.
        ```ts
        'admin-read-write' | 'admin-read-only' | 'object-read-write' | 'object-read-only'
        ```
      ::
      ::field{name="ttl" type="number"}
        The ttl of the credentials in seconds, defaults to `900`.
      ::
      ::field{name="pathnames" type="string[]"}
        The pathnames to scope the credentials to.
      ::
      ::field{name="prefixes" type="string[]"}
        The prefixes to scope the credentials to.
      ::
    ::
  ::
::

#### Return

Returns an object with the following properties:

```ts
{
  accountId: string
  bucketName: string
  accessKeyId: string
  secretAccessKey: string
  sessionToken: string
}
```

## `ensureBlob()`

`ensureBlob()` is a handy util to validate a `Blob` by checking its size and type:

```ts
// Will throw an error if the file is not an image or is larger than 1MB
ensureBlob(file, { maxSize: '1MB', types: ['image']})
```

#### Params

::field-group
  ::field{name="file" type="Blob" required}
    The file to validate.
  ::
  ::field{name="options" type="Object" required}
    Note that at least `maxSize` or `types` should be provided.
    ::collapsible
      ::field{name="maxSize" type="BlobSize"}
        The maximum size of the file, should be: :br
        (`1` | `2` | `4` | `8` | `16` | `32` | `64` | `128` | `256` | `512` | `1024`) + (`B` | `KB` | `MB` | `GB`) :br
        e.g. `'512KB'`, `'1MB'`, `'2GB'`, etc.
      ::
      ::field{name="types" type="BlobType[]"}
        Allowed types of the file, e.g. `['image/jpeg']`.
      ::
    ::
  ::
::

#### Return

Returns nothing.

Throws an error if `file` doesn't meet the requirements.

## Vue Composables

::note
The following composables are meant to be used in the Vue side of your application (not the `server/` directory).
::

### `useUpload()`

`useUpload` is to handle file uploads in your Nuxt application.

```vue
<script setup lang="ts">
const upload = useUpload('/api/blob', { method: 'PUT' })

async function onFileSelect({ target }: Event) {
  const uploadedFiles = await upload(target as HTMLInputElement)

  // file uploaded successfully
}
</script>

<template>
  <input
    accept="image/jpeg, image/png"
    type="file"
    name="file"
    multiple
    @change="onFileSelect"
  >
</template>
```

#### Params

::field-group
  ::field{name="apiBase" type="string" required}
    The base URL of the upload API.
  ::
  ::field{name="options" type="Object" required}
    Optionally, you can pass Fetch options to the request. Read more about Fetch API [here](https://developer.mozilla.org/en-US/docs/Web/API/fetch#options).
    ::collapsible
      ::field{name="formKey" type="string"}
        The key to add the file/files to the request form. Defaults to `'files'`.
      ::
      ::field{name="multiple" type="boolean"}
        Whether to allow multiple files to be uploaded. Defaults to `true`.
      ::
    ::
  ::
::

#### Return

Return a `MultipartUpload` function that can be used to upload a file in parts.

```ts
const { completed, progress, abort } = upload(file)
const data = await completed
```

### `useMultipartUpload()`

Application composable that creates a multipart upload helper.

```ts [utils/multipart-upload.ts]
export const mpu = useMultipartUpload('/api/files/multipart')
```

#### Params

::field-group
  ::field{name="baseURL" type="string"}
    The base URL of the multipart upload API handled by [`handleMultipartUpload()`](#handlemultipartupload).
  ::
  ::field{name="options"}
    The options for the multipart upload helper.
    ::collapsible
      ::field{name="partSize" type="number"}
        The size of each part of the file to be uploaded. Defaults to `10MB`.
      ::
      ::field{name="concurrent" type="number"}
        The maximum number of concurrent uploads. Defaults to `1`.
      ::
      ::field{name="maxRetry" type="number"}
        The maximum number of retry attempts for the whole upload. Defaults to `3`.
      ::
      ::field{name="prefix" type="string"}
        The prefix to use for the blob pathname.
      ::
      ::field{name="fetchOptions" type="Omit<FetchOptions, 'method' | 'baseURL' | 'body' | 'parseResponse' | 'responseType'>"}
        Override the ofetch options.
        The `query` and `headers` will be merged with the options provided by the uploader.
      ::
    ::
  ::
::

#### Return

Return a `MultipartUpload` function that can be used to upload a file in parts.

```ts
const { completed, progress, abort } = mpu(file)
const data = await completed
```

## Types

### `BlobObject`

```ts
interface BlobObject {
  pathname: string
  contentType: string | undefined
  size: number
  httpEtag: string
  uploadedAt: Date
  httpMetadata: Record<string, string>
  customMetadata: Record<string, string>
}
```

### `BlobMultipartUpload`

```ts
export interface BlobMultipartUpload {
  pathname: string
  uploadId: string
  uploadPart(
    partNumber: number,
    value: string | ReadableStream<any> | ArrayBuffer | ArrayBufferView | Blob
  ): Promise<BlobUploadedPart>
  abort(): Promise<void>
  complete(uploadedParts: BlobUploadedPart[]): Promise<BlobObject>
}
```

### `BlobUploadedPart`

```ts
export interface BlobUploadedPart {
  partNumber: number;
  etag: string;
}
```

### `MultipartUploader`

```ts
export type MultipartUploader = (file: File) => {
  completed: Promise<SerializeObject<BlobObject> | undefined>
  progress: Readonly<Ref<number>>
  abort: () => Promise<void>
}
```

### `BlobListResult`

```ts
interface BlobListResult {
  blobs: BlobObject[]
  hasMore: boolean
  cursor?: string
  folders?: string[]
}
```

## Examples

### List blobs with pagination

::code-group
```ts [server/api/blobs.get.ts]
export default eventHandler(async (event) => {
  const { limit, cursor } = await getQuery(event)

  return hubBlob().list({
    limit: limit ? Number.parseInt(limit) : 10,
    cursor: cursor ? cursor : undefined
  })
})
```

```vue [pages/blobs.vue]
<script setup lang="ts">
const blobs = ref<BlobObject[]>([])
const hasMore = ref(true)
const cursor = ref()

async function loadMore() {
  if (!hasMore.value) {
    return
  }
  const res = await $fetch('/api/blobs', {
    query: {
      limit: 3,
      cursor: cursor.value
    }
  })
  blobs.value.push(...res.blobs)
  hasMore.value = res.hasMore
  cursor.value = res.cursor
}
</script>
<template>
  <div>
    <div v-for="blob in blobs" :key="blob.pathname">
      {{ blob.pathname }}
    </div>
    <button @click="loadMore">
      Load more
    </button>
  </div>
</template>
```
::

### Create presigned URLs to upload files to R2

Presigned URLs can be used to upload files to R2 from client-side without using an API key.

:img{src="/images/docs/blob-presigned-urls.png" alt="NuxtHub presigned URLs to upload files to R2" width="915" height="515" class="rounded"}

As we use [aws4fetch](https://github.com/mhart/aws4fetch) to sign the request and [zod](https://github.com/colinhacks/zod) to validate the request, we need to install the packages:

```bash [Terminal]
npx nypm i aws4fetch zod
```

First, we need to create an API route that will return a presigned URL to the client.

```ts [server/api/blob/sign/\[...pathname\\].get.ts]
import { z } from 'zod'
import { AwsClient } from 'aws4fetch'

export default eventHandler(async (event) => {
  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)
  // Create credentials with the right permission & scope
  const blob = hubBlob()
  const { accountId, bucketName, ...credentials } = await blob.createCredentials({
    permission: 'object-read-write',
    pathnames: [pathname]
  })
  // Create the presigned URL
  const client = new AwsClient(credentials)
  const endpoint = new URL(
    pathname,
    `https://${bucketName}.${accountId}.r2.cloudflarestorage.com`
  )
  const { url } = await client.sign(endpoint, {
    method: 'PUT',
    aws: { signQuery: true }
  })
  // Return the presigned URL to the client
  return { url }
})
```

::important
Make sure to authenticate the request on the server side to avoid letting anyone upload files to your R2 bucket. Checkout [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) as one of the possible solutions.
::

Next, we need to create the Vue page to upload a file to our R2 bucket using the presigned URL:

```vue [pages/upload.vue]
<script setup lang="ts">
async function uploadWithPresignedUrl(file: File) {
  const { url } = await $fetch(`/api/blob/sign/${file.name}`)
  await $fetch(url, {
    method: 'PUT',
    body: file
  })
}
</script>

<template>
  <input type="file" @change="uploadWithPresignedUrl($event.target.files[0])">
</template>
```

At this stage, you will get a CORS error because we did not setup the CORS on our R2 bucket.

To setup the CORS on our R2 bucket:
- Open the project on NuxtHub Admin with `npx nuxthub manage`
- Go to the **Blob tab** (make sure to be on the right environment: production or preview)
- Click on the Cloudflare icon on the top right corner
- Once on Cloudflare, Go to the `Settings` tab of your R2 bucket
- Scroll to **CORS policy**
- Click on `Edit CORS policy`
- Update the allowed origins with your origins by following this example:
```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://my-app.nuxt.dev"
    ],
    "AllowedMethods": [
      "GET",
      "PUT"
    ],
    "AllowedHeaders": [
      "*"
    ]
  }
]
```
- Save the changes

That's it! You can now upload files to R2 using the presigned URLs.

::callout
Read more about presigned URLs on Cloudflare's [official documentation](https://developers.cloudflare.com/r2/api/s3/presigned-urls/).
::

## Pricing

:pricing-table{:tabs='["Blob"]'}

