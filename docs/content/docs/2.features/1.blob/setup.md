---
title: Setup
description: Configure Blob Storage in your Nuxt application, including installation, environment variables, and initial setup for uploading and serving files.
---

## Getting Started

Enable blob storage in your project by setting `blob: true` in the NuxtHub config.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    blob: true
  }
})
```

### Automatic Configuration

NuxtHub automatically configures the blob storage driver based on your hosting provider when `blob: true` is set in the NuxtHub config.

::tabs{sync="provider"}
  :::tabs-item{label="Vercel Blob" icon="i-simple-icons-vercel"}

    When deploying to Vercel, it automatically configures [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob).

    1. Install the `@vercel/blob` package

    :pm-install{name="@vercel/blob"}

    2. Assign a Vercel Blob Store to your project from the [Vercel dashboard](https://vercel.com/) -> Project -> Storage

    ::important
      Files stored in Vercel Blob are always public. Manually configure a different storage driver if storing sensitive files.
    ::

    3. When running locally, you can set the `BLOB_READ_WRITE_TOKEN` environment variable to enable the Vercel Blob driver:

    ```bash [.env]
    BLOB_READ_WRITE_TOKEN=your-token
    ```
  :::

  :::tabs-item{label="Cloudflare R2" icon="i-simple-icons-cloudflare"}

    When deploying to Cloudflare, it automatically configures [Cloudflare R2](https://developers.cloudflare.com/r2/).

    Add a `BLOB` binding to a [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket in your `wrangler.jsonc` config.

    ```json [wrangler.jsonc]
    {
      "$schema": "node_modules/wrangler/config-schema.json",
      // ...
      "r2_buckets": [
        {
          "binding": "BLOB",
          "bucket_name": "<bucket_name>"
        }
      ]
    }
    ```

    Learn more about adding bindings on [Cloudflare's documentation](https://developers.cloudflare.com/r2/api/workers/workers-api-usage/).

    ::tip
      To use Cloudflare R2 without hosting on Cloudflare Workers, use the [Cloudflare R2 via S3 API](https://developers.cloudflare.com/r2/api/s3/api/).
    ::

  :::

  :::tabs-item{label="S3" icon="i-simple-icons-amazons3"}

    To configure [Amazon S3](https://aws.amazon.com/s3/) as a blob storage driver.

    1. Install the `aws4fetch` package
    
    :pm-install{name="aws4fetch"}

    2. Set the following environment variables:

    ```bash [.env]
    S3_ACCESS_KEY_ID=your-access-key-id
    S3_SECRET_ACCESS_KEY=your-secret-access-key
    S3_BUCKET=your-bucket-name
    S3_REGION=your-region
    S3_ENDPOINT=your-endpoint # (optional)
    ```
  :::

  :::tabs-item{label="Filesystem" icon="i-simple-icons-nodedotjs"}
    To customize the directory, you can set the `dir` option.

    ```ts [nuxt.config.ts]
    export default defineNuxtConfig({
      hub: {
        blob: {
          driver: 'fs',
          dir: '.data/my-blob-directory' // Defaults to `.data/blob`
        }
      }
    })
    ```

    ::important
      The local filesystem driver is not suitable for production environments.
    ::
  :::
::

::callout
By default, the local filesystem driver is used if no automatic configuration is found.
::

### Custom Driver

You can set a custom driver by providing a configuration object to `blob`.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    blob: {
      driver: 'fs',
      dir: '.data/blob'
    }
  },
  // or overwrite only in production
  $production: {
    hub: {
      blob: {
        driver: 'cloudflare-r2',
        binding: 'BLOB'
      }
    }
  }
})
```

::callout{to="https://unstorage.unjs.io/drivers"}
You can find the driver list on [unstorage documentation](https://unstorage.unjs.io/drivers) with their configuration.
::

## `ensureBlob()`

`ensureBlob()` is a handy util to validate a `Blob` by checking its size and type:

```ts
import { ensureBlob } from 'hub:blob'

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

::important
When using the Vercel Blob driver, this utility will automatically use the [Vercel Blob Client SDK](https://vercel.com/docs/vercel-blob/client-upload) to upload the file.
::

```ts [utils/multipart-upload.ts]
export const mpu = useMultipartUpload('/api/files/multipart')
```

#### Params

::field-group
  ::field{name="baseURL" type="string"}
    The base URL of the multipart upload API handled by [`handleMultipartUpload()`](/docs/features/blob/usage#handlemultipartupload).
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
  url: string | undefined
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
