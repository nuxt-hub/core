---
title: Usage
description: Learn how to upload, read, delete, and manage files using Blob Storage in your Nuxt application, with common patterns and examples.
---

The `hub:blob` module provides access to the Blob storage through an [unstorage](https://unstorage.unjs.io) instance.

```ts
import { blob } from 'hub:blob'
```

::tip
`blob` is auto-imported on server-side, you can directly use it without importing it from `hub:blob`.
::

## `list()`

Returns a paginated list of blobs (metadata only).

```ts [server/api/files.get.ts]
import { blob } from 'hub:blob'

export default eventHandler(async () => {
  const { blobs } = await blob.list({ limit: 10 })

  return blobs
})
```

::note
When using the local filesystem driver, the `limit` option is ignored and all blobs are returned.
::

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

Returns [`BlobListResult`](/docs/features/blob/setup#bloblistresult).

#### Return all blobs

To fetch all blobs, you can use a `while` loop to fetch the next page until the `cursor` is `null`.

```ts
import { blob } from 'hub:blob'

let blobs = []
let cursor = null

do {
  const res = await blob.list({ cursor })
  blobs.push(...res.blobs)
  cursor = res.cursor
} while (cursor)
```

## `serve()`

Returns a blob's data and sets `Content-Type`, `Content-Length` and `ETag` headers.

::code-group
```ts [server/routes/images/[...pathname\\].get.ts]
import { blob } from 'hub:blob'

export default eventHandler(async (event) => {
  const { pathname } = getRouterParams(event)

  return blob.serve(event, pathname)
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
import { blob } from 'hub:blob'

export default eventHandler(async (event) => {
  const { pathname } = getRouterParams(event)

  setHeader(event, 'Content-Security-Policy', 'default-src \'none\';')
  return blob.serve(event, pathname)
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

## `head()`

Returns a blob's metadata.

```ts
const metadata = await blob.head(pathname)
```

#### Params

::field-group
  ::field{name="pathname" type="String"}
    The name of the blob to serve.
  ::
::

#### Return

Returns a [`BlobObject`](/docs/features/blob/setup#blobobject).


## `get()`

Returns a blob body.

```ts
const file = await blob.get(pathname)
```

#### Params

::field-group
  ::field{name="pathname" type="String"}
    The name of the blob to serve.
  ::
::

#### Return

Returns a [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) or `null` if not found.

## `put()`

Uploads a blob to the storage.

```ts [server/api/files.post.ts]
import { blob, ensureBlob } from 'hub:blob'

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

  return blob.put(file.name, file, {
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
      ::field{name="access" type="'public' | 'private'"}
        The access level of the blob. Can be `'public'` or `'private'`. Note that only S3 driver supports this option currently.
      ::
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
        An object with custom metadata to store with the blob. *(not supported in Vercel Blob driver at the moment)*
      ::
    ::
  ::
::

#### Return

Returns a [`BlobObject`](/docs/features/blob/setup#blobobject).

## `del()`

Delete a blob with its pathname.

```ts [server/api/files/[...pathname\\].delete.ts]
import { blob } from 'hub:blob'

export default eventHandler(async (event) => {
  const { pathname } = getRouterParams(event)

  await blob.del(pathname)

  return sendNoContent(event)
})
```

You can also delete multiple blobs at once by providing an array of pathnames:

```ts
await blob.del(['images/1.jpg', 'images/2.jpg'])
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

## `handleUpload()`

This is an "all in one" function to validate a `Blob` by checking its size and type and upload it to the storage.

::note
This server util is made to be used with the [`useUpload()`](/docs/features/blob/setup#useupload) Vue composable.
::

It can be used to handle file uploads in API routes.

::code-group
```ts [server/api/blob.put.ts]
import { blob } from 'hub:blob'

export default eventHandler(async (event) => {
  return blob.handleUpload(event, {
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
    See [`ensureBlob()`](/docs/features/blob/setup#ensureblob) options for more details.
  ::
  ::field{name="put" type="BlobPutOptions"}
    See [`put()`](#put) options for more details.
  ::
::

#### Return

Returns a [`BlobObject`](/docs/features/blob/setup#blobobject) or an array of [`BlobObject`](/docs/features/blob/setup#blobobject) if `multiple` is `true`.

Throws an error if `file` doesn't meet the requirements.

## `handleMultipartUpload()`

Handle the request to support multipart upload.

```ts [server/api/files/multipart/[action\\]/[...pathname\\].ts]
import { blob } from 'hub:blob'

export default eventHandler(async (event) => {
  return await blob.handleMultipartUpload(event)
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

::note{to="/docs/features/blob/setup#usemultipartupload"}
See [`useMultipartUpload()`](/docs/features/blob/setup#usemultipartupload) on usage details.
::


::important
Multipart uploads are only supported on Vercel Blob, Cloudflare R2, S3 and filesystem drivers.
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

## `createMultipartUpload()`

::note
We recommend using [`handleMultipartUpload()`](#handlemultipartupload) to handle the multipart upload requests.
:br
:br
If you want to handle multipart uploads manually using this utility, keep in mind that you cannot use this utility with Vercel Blob due to payload size limits on Vercel functions. Consider using [Vercel Blob Client SDK](https://vercel.com/docs/vercel-blob/client-upload).
::

Start a new multipart upload.

```ts [server/api/files/multipart/[...pathname\\].post.ts]
import { blob } from 'hub:blob'

export default eventHandler(async (event) => {
  const { pathname } = getRouterParams(event)

  const mpu = await blob.createMultipartUpload(pathname)

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

## `resumeMultipartUpload()`

::note
We recommend using [`handleMultipartUpload()`](#handlemultipartupload) to handle the multipart upload requests.
::

Continue processing of unfinished multipart upload.

To upload a part of the multipart upload, you can use the `uploadPart()` method:

```ts [server/api/files/multipart/[...pathname\\].put.ts]
import { blob } from 'hub:blob'

export default eventHandler(async (event) => {
  const { pathname } = getRouterParams(event)
  const { uploadId, partNumber } = getQuery(event)

  const stream = getRequestWebStream(event)!
  const body = await streamToArrayBuffer(stream, contentLength)

  const mpu = blob.resumeMultipartUpload(pathname, uploadId)
  return await mpu.uploadPart(partNumber, body)
})
```

Complete the upload by calling `complete()` method:

```ts [server/api/files/multipart/complete.post.ts]
export default eventHandler(async (event) => {
  const { pathname, uploadId } = getQuery(event)
  const parts = await readBody(event)

  const mpu = blob.resumeMultipartUpload(pathname, uploadId)
  return await mpu.complete(parts)
})
```

If you want to cancel the upload, you need to call `abort()` method:

```ts [server/api/files/multipart/[...pathname\\].delete.ts]
export default eventHandler(async (event) => {
  const { pathname } = getRouterParams(event)
  const { uploadId } = getQuery(event)

  const mpu = blob.resumeMultipartUpload(pathname, uploadId)
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
