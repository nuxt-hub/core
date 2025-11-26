---
title: Self-Hosting First & Cloud-Agnostic Future
description: "We are evolving NuxtHub to become a truly multi-cloud platform. This transition requires us to move away from features tightly coupled to a single cloud provider and adopt a more flexible, cloud-agnostic approach."
date: 2025-11-25
image: '/images/changelog/self-hosting-first.png'
authors:
  - name: Rihan Arfan
    avatar:
      src: https://avatars.githubusercontent.com/u/20425781?v=4
    to: https://bsky.app/profile/rihan.dev
    username: rihan.dev
  - name: Sebastien Chopin
    avatar:
      src: https://avatars.githubusercontent.com/u/904724?v=4
    to: https://x.com/atinux
    username: atinux
---

::tip
This feature is available in [`@nuxthub/core >= v0.9.1`](https://github.com/nuxt-hub/core/releases/tag/v0.9.1).
::

Following the [acquisition of NuxtLabs](https://nuxtlabs.com), we are evolving NuxtHub to become a truly multi-cloud platform. This transition requires us to move away from features tightly coupled to a single cloud provider and adopt a more flexible, cloud-agnostic approach.

## What's Changing

### NuxtHub Admin Sunset

**NuxtHub Admin will be sunset on December 31st, 2025.** This platform was designed specifically for Cloudflare deployments, which conflicts with our multi-cloud vision. We are now recommending all projects to adopt self-hosting practices.

::note{to="/docs/getting-started/deploy#self-hosted-recommended"}
Read more about self-hosting.
::

### Enhanced Self-Hosting Support

To ensure a smooth transition, we've significantly improved the self-hosting experience with direct Cloudflare API integration. You can now use more features without relying on NuxtHub Admin:

#### **Simplified Remote Storage Setup**
- New `hub.projectUrl` configuration option for cleaner setup
- Environment-based project URL selection (production/preview)
- Direct project-to-project authentication via `NUXT_HUB_PROJECT_SECRET_KEY`
- No more CLI linking required for remote storage access

::note{to="/docs/getting-started/remote-storage"}
Read more about the remote storage setup.
::

#### **Direct Cloudflare API Support**
New environment variables enable direct API access for self-hosted projects:
- `NUXT_HUB_CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `NUXT_HUB_CLOUDFLARE_API_TOKEN` - API token for service access
- `NUXT_HUB_CLOUDFLARE_BUCKET_ID` - For R2 blob operations
- `NUXT_HUB_CLOUDFLARE_CACHE_NAMESPACE_ID` - For KV cache operations

These credentials allow you to:
- Run AI and AutoRAG models during local development
- Perform cache bulk deletion operations with the Nuxt DevTools
- Generate presigned URLs for blob uploads at runtime

### Cloud-Specific Features Deprecated

As part of our multi-cloud strategy, we are deprecating features that are specific to Cloudflare:

- **AI & AutoRAG** - Use [AI SDK](https://ai-sdk.dev/) with the [Workers AI Provider](https://ai-sdk.dev/providers/community-providers/cloudflare-workers-ai) instead, or access `process.env.AI` directly
- **Browser (Puppeteer)** - Cloudflare-specific browser automation
- **Vectorize** - Cloudflare's vector database
- **Additional Bindings** - Direct Cloudflare Workers bindings

These features are now marked as deprecated in the documentation and will be removed in a future major version to maintain framework neutrality.

## Migration Guide

### For Current NuxtHub Admin Users

1. **Switch to self-hosting** by following the updated [remote storage documentation](/docs/getting-started/remote-storage)
2. **Set up direct authentication** using `NUXT_HUB_PROJECT_SECRET_KEY`
3. **Configure Cloudflare credentials** if using AI, AutoRAG, or advanced blob/cache features

### For Self-Hosted Projects

Update your environment configuration to use the new Cloudflare API credentials:

```bash [.env]
# Required for remote storage
NUXT_HUB_PROJECT_SECRET_KEY=<your-secret-key>

# Optional: for direct Cloudflare API features (AI, AutoRAG, etc.)
NUXT_HUB_CLOUDFLARE_ACCOUNT_ID=<your-account-id>
NUXT_HUB_CLOUDFLARE_API_TOKEN=<your-api-token>
NUXT_HUB_CLOUDFLARE_BUCKET_ID=<your-bucket-id>
NUXT_HUB_CLOUDFLARE_CACHE_NAMESPACE_ID=<your-namespace-id>
```
::note
In the coming weeks, we will update the NuxtHub Admin with an easier migration path to help you either stay on Cloudflare or move to Vercel.
::
