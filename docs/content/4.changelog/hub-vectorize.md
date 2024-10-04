---
title: Introducing hubVectorize()
description: "Run machine learning models, such as LLMs in your Nuxt application, with minimal setup."
date: 2024-10-03
image: '/images/changelog/hub-vectorize.png'
category: Core
authors:
  - name: Rihan Arfan
    avatar:
      src: https://avatars.githubusercontent.com/u/20425781?v=4
    to: https://x.com/RihanArfan
    username: RihanArfan
---

::tip
This feature is available on both [free and pro plans](/pricing) and in [`@nuxthub/core >= v0.0.0`](https://github.com/nuxt-hub/core/releases/tag/v0.0.0).
::

We are excited to introduce [`hubVectorize()`](/docs/features/vectorize), which gives you access to a globally distributed vector database from Nuxt. Paired with [`hubAI()`](/docs/features/ai), it makes Nuxt a perfect framework for easily building full-stack AI-powered applications.

## What is a vector database?

Vector databases allows you to querying embeddings, which are representations of values or objects like text, images, audio that are designed to be consumed by machine learning models and semantic search algorithms.

Some key use cases of vector databases include:
- Semantic search, used to return results similar to the input of the query.
- Classification, used to return the grouping (or groupings) closest to the input query.
- Recommendation engines, used to return content similar to the input based on different criteria (for example previous product sales, or user history).

Vector databases are commonly used for [Retrieval-Augmented Generation (RAG)](https://developers.cloudflare.com/reference-architecture/diagrams/ai/ai-rag/), which is a technique that enhances language models by retrieving relevant information from an external knowledge base before generating a response.

Learn more about vector databases on [Cloudflare's documentation](https://developers.cloudflare.com/vectorize/reference/what-is-a-vector-database/).

## How to use hubAI()

1. Update `@nuxthub/core` to the latest version (`v0.0.0` or later)

2. Configure a Vectorize index in `hub.vectorize` in your `nuxt.config.ts`

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    vectorize: {
      tutorial: {
        dimensions: 768,
        metric: "cosine"
      }
    }
  }
})
```

3. Run `npx nuxthub link` to link a NuxtHub project or create a new one

4. Deploy the project to NuxtHub with `npx nuxthub deploy`

5. Start Nuxt and connect to [remote storage](/docs/getting-started/remote-storage) by running [`npx nuxt dev --remote`](/docs/getting-started/remote-storage)

5. You can now use [`hubVectorize('<index>')`](/docs/features/vectorize) in your server routes

```ts [server/api/vectorize-search.ts]
export default defineEventHandler(async (event) => {
  const { query, limit } = getQuery(event)
  const embeddings = await hubAI().run('@cf/baai/bge-base-en-v1.5', {
    text: query
  })
  const queryVector = embeddings.data[0]

  const index = hubVectorize('tutorial')
  return await vectorize.query(vectors, {
    topK: limit,
  })
})
```

Read the [full documentation](/docs/features/vectorize) to learn more about `hubVectorize()`.

::important
**If you already have a NuxtHub account**, make sure to add the `Vectorize` permission on your Cloudflare API token.

- Open [Cloudflare User API Tokens](https://dash.cloudflare.com/profile/api-tokens)
- Find the NuxtHub token(s)
- Add the `Account > Vectorize > Edit` permission
- Save the changes

Another solution is to link again your Cloudflare account from your NuxtHub team settings by clicking on `Link a new account` > `Create a token with required permissions`.
::

::note
This feature has been implemented in [nuxt-hub/core#177](https://github.com/nuxt-hub/core/pull/177).
::
