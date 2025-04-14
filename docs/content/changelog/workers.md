---
title: NuxtHub on Workers
description: "Deploy your Nuxt apps to Cloudflare Workers and build real-time experiences with zero configuration."
date: 2025-04-14
image: '/images/changelog/workers-support.png'
authors:
  - name: Sebastien Chopin
    avatar:
      src: https://avatars.githubusercontent.com/u/904724?v=4
    to: https://bsky.app/profile/atinux.com
    username: atinux
  - name: Rihan Arfan
    avatar:
      src: https://avatars.githubusercontent.com/u/20425781?v=4
    to: https://bsky.app/profile/rihan.dev
    username: rihan.dev
  - name: Ahad Birang
    avatar:
      src: https://avatars.githubusercontent.com/u/2047945?v=4
    to: https://bsky.app/profile/farnabaz.dev
    username: farnabaz.dev
---

::tip
This feature is available on both [free and pro plans](/pricing) and in [`@nuxthub/core >= v0.8.24`](https://github.com/nuxt-hub/core/releases/tag/v0.8.24).
::

After much development (and [many](https://x.com/Atinux/status/1907552625559744865/photo/1) [teasers](https://x.com/Atinux/status/1884315020982657452/video/1)), we're thrilled to announce that NuxtHub now supports deploying to Cloudflare Workers!

## Why Workers

For a while, Cloudflare have been releasing exciting new features such as [observability & persistent logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/), [workflows](https://developers.cloudflare.com/workflows/), [cron triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/), and [much more](https://developers.cloudflare.com/workers/static-assets/migrate-from-pages/#compatibility-matrix). However, these features are only available on Cloudflare Workers, and were not brought to Cloudflare Pages.

Now with the introduction of [static assets](https://developers.cloudflare.com/workers/static-assets/), suddenly it is now viable to deploy Nuxt applications to Cloudflare Workers, and we can benefit from the new features and services available on Cloudflare Workers.

## Real-time

Projects deployed to NuxtHub on Workers also fully support [Nitro WebSocket](https://nitro.build/guide/websocket), allowing you to create real-time experiences on NuxtHub. Simply set `nitro.experimental.websocket` to `true` in your `nuxt.config.ts`, create your websocket server route with crossws, and deploy!

Under the hood this is powered by Cloudflare Durable Objects. Nitro and NuxtHub magically takes care of everything related to the Durable Object, from building to deploying.

Check out our [multiplayer-globe](https://github.com/nuxt-hub/multiplayer-globe) template for an example of using websockets ([live demo](https://multiplayer-globe.nuxthub.workers.dev/)).

::note{to=https://nitro.build/guide/websocket icon="i-lucide-book"}
Learn more about Nitro WebSocket on the Nitro documentation
::

## Deploying to Workers

Get started by creating a new project and selecting the Cloudflare Workers type on the [NuxtHub Admin](https://admin.hub.nuxt.com) or with the latest version of the `nuxthub` CLI ([v0.9.0](https://github.com/nuxt-hub/cli/releases)). All our templates are fully compatible with NuxtHub on Workers.

We're working on a migration path to help simplify the switch from Cloudflare Pages to Workers. Until then, you can deploy your existing Nuxt apps to Cloudflare Workers by setting `hub.workers` to `true`, and linking them to a separate new project with the Workers type, then manually moving any data stored in your database, KV or blob.

::note
While NuxtHub on Workers is in beta, preview environments aren't unavailable. Stay tuned for updates.
::

::important
**If you already have a NuxtHub account**, make sure to add the `Workers Scripts` permission on your Cloudflare API token.

- Open [Cloudflare User API Tokens](https://dash.cloudflare.com/profile/api-tokens)
- Find your NuxtHub token(s)
- Add the `Workers Scripts > Edit` permission
- Save the changes

Another solution is to link again your Cloudflare account from your NuxtHub team settings by clicking on `Connect a different Cloudflare account` > `Create a token`.
::

## What's next

Throughout the next few weeks, we'll be enhancing NuxtHub on Workers with new features and integration with more Cloudflare Workers-specific services, including:

- **Observability**: Automatically ingest, filter, and analyse logs
- **Queues**: Process background tasks effectively at scale
- **Cron Tasks**: Run Nitro tasks automatically on a schedule
- **Environments**: Bringing the preview environment to NuxtHub on Workers

Let us know your feedback by joining our [Discord](https://discord.gg/vW89dsVqBF), following us on [X](https://x.com/nuxt_hub), or emailing us at hub@nuxt.com.
