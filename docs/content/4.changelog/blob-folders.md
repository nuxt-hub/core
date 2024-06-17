---
title: Blob Folders
description: "It is now possible to change the view of your blobs to a folder structure."
date: 2024-06-03
image: '/images/changelog/blob-folders.png'
category: Admin
authors:
  - name: Sebastien Chopin
    avatar: 
      src: https://avatars.githubusercontent.com/u/904724?v=4
    to: https://x.com/atinux
    username: atinux
  - name: Ahad Birang
    avatar: 
      src: https://avatars.githubusercontent.com/u/2047945?v=4
    to: https://x.com/a_birang
    username: a_birang
---

We are excited to announce that we have added a new feature to NuxtHub Blobs: **Folders**!

::tip
This feature is available on all [NuxtHub plans](/pricing).
::

It comes with the [v0.6.0](https://github.com/nuxt-hub/core/releases/tag/v0.6.0) release of `@nuxthub/core`.

When uploading a blob, you can now specify a folder path with the `prefix`. This will allow you to organize your blobs in a more structured way.

```ts
const { put } = hubBlob()

await put('my-blob.txt', myFile, {
  prefix: 'folder/subfolder'
})
```

::callout{icon="i-ph-book-open-duotone" to="/docs/storage/blob"}
Learn more about Blob Storage.
::

When viewing your blobs in the [NuxtHub admin](https://admin.hub.nuxt.com), you will now see a folder structure:

:nuxt-img{src="/images/changelog/server-cache.png" alt="NuxtHub Deployment Details" width="915" height="515"}

::callout{icon="i-ph-heart-duotone"}
Thank you to [Gerben Mulder](https://github.com/Gerbuuun) for suggesting this feature on [nuxt-hub/core#101](https://github.com/nuxt-hub/core/issues/101).
::
