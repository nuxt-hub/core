---
title: Improved self-hosting experience
description: "Enable usage of more features without relying on NuxtHub Admin"
date: 2025-11-25
image: '/images/changelog/nuxthub-admin-sunset.png'
authors:
  - name: Rihan Arfan
    avatar:
      src: https://avatars.githubusercontent.com/u/20425781?v=4
    to: https://bsky.app/profile/rihan.dev
    username: rihan.dev
---

::tip
This feature is available in [`@nuxthub/core >= v0.9.1`](https://github.com/nuxt-hub/core/releases/tag/v0.9.1).
::

With the introduction of multi-cloud provider support in NuxtHub v0.10, NuxtHub Admin is due to be sunset on 31st December 2025. We recommend all projects migrate off NuxtHub Admin using our new migration tool, and upgrade to NuxtHub v0.10. Learn more about the migration process at https://hub.nuxt.com/blog/nuxthub-v0-10-0

To ease the transition for projects that cannot upgrade to NuxtHub v0.10 yet, we have improved the self-hosting experience to enable usage of more features without relying on NuxtHub Admin via direct usage of the Cloudflare API. These features include:
- Using AI and AutoRAG during local development
- Cache remote storage bulk deletion
- Blob presigned URL creation during runtime

To switch from NuxtHub Admin to self-hosting on NuxtHub v0.9.1, see the following documentation:
- [Deploying your project without NuxtHub Admin](/docs/getting-started/deploy#self-hosted)
- [Remote storage when self-hosting](/docs/getting-started/remote-storage#self-hosted)
