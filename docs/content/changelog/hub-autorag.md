---
title: Introducing hubAutoRAG()
description: "Create fully-managed RAG pipelines to power your AI applications with accurate and up-to-date information."
date: 2024-09-09
image: '/images/changelog/nuxthub-autorag.jpg'
authors:
  - name: Rihan Arfan
    avatar:
      src: https://avatars.githubusercontent.com/u/20425781?v=4
    to: https://bsky.app/profile/rihan.dev
    username: rihan.dev
---

::tip
This feature is available from [`@nuxthub/core >= v0.8.26`](https://github.com/nuxt-hub/core/releases/tag/v0.8.26)
::


We are excited to introduce [`hubAutoRAG()`](/docs/features/autorag). Cloudflare [AutoRAG](https://developers.cloudflare.com/autorag/) lets you create fully-managed, retrieval-augmented generation pipelines that continuously updates and scales on Cloudflare. With AutoRAG, you can integrate context-aware AI into your Nuxt applications without managing infrastructure.

If you are currently using [`hubVectorize()`](/docs/features/vectorize), you may be interested in switching to `hubAutoRAG()` for a simplified developer experience. AutoRAG automatically indexes your data into vector embeddings optimized for semantic search. Once a data source is connected, indexing runs continuously in the background to keep your knowledge base fresh and queryable.

## How to use hubAutoRAG()

1. Update `@nuxthub/core` to the latest version (`v0.8.26` or later)

2. Enable `hub.ai` in your `nuxt.config.ts`

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    ai: true
  }
})
```

3. Create an AutoRAG instance from the [Cloudflare dashboard](https://dash.cloudflare.com/?to=/:account/ai/autorag) and add your data source.

::callout{to="https://dash.cloudflare.com/?to=/:account/ai/autorag"}
Go to [AutoRAG](https://dash.cloudflare.com/?to=/:account/ai/autorag) in the [Cloudflare dashboard](https://dash.cloudflare.com/?to=/:account/ai/autorag)
::

4. Start using [`hubAutoRAG()`](/docs/features/browser) in your server routes

```ts [server/api/rag.ts]
export default eventHandler(async () => {
  const autorag = hubAutoRAG("nuxt-ui") // access AutoRAG instance
  return await autorag.aiSearch({
    query: "How do I create a modal with Nuxt UI?",
    model: "@cf/meta/llama-3.3-70b-instruct-sd",
    rewrite_query: true,
    max_num_results: 2,
    ranking_options: {
      score_threshold: 0.7,
    },
  })
})
```

5. [Deploy your project with NuxtHub](/docs/getting-started/deploy)

::note{to="/docs/features/autorag"}
Read the documentation about `hubAutoRAG()` to learn more.
::
