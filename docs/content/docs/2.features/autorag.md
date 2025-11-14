---
title: AutoRAG
navigation.title: AutoRAG
description: Create fully-managed RAG pipelines to power your AI applications with accurate and up-to-date information.
---

[AutoRAG](https://developers.cloudflare.com/autorag/) lets you create fully-managed, retrieval-augmented generation (RAG) pipelines that continuously updates and scales on Cloudflare. With AutoRAG, you can integrate context-aware AI into your Nuxt applications without managing infrastructure.

Cloudflare AutoRAG automatically indexes your data into vector embeddings optimized for semantic search. Once a data source is connected, indexing runs continuously in the background to keep your knowledge base fresh and queryable.

## Getting Started

Use AutoRAG by enabling AI in your NuxtHub project by adding the `ai` property to the `hub` object in your `nuxt.config.ts` file.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    ai: true
  },
})
```

::note
This option will enable [Workers AI](https://developers.cloudflare.com/workers-ai) (LLM powered by serverless GPUs on Cloudflare’s global network) and automatically add the binding to your project when you [deploy it](/docs/getting-started/deploy).
::

Then create an AutoRAG instance from the [Cloudflare dashboard](https://dash.cloudflare.com/?to=/:account/ai/autorag) and add your data source.

::callout{to="https://dash.cloudflare.com/?to=/:account/ai/autorag"}
Go to [AutoRAG](https://dash.cloudflare.com/?to=/:account/ai/autorag) in the [Cloudflare dashboard](https://dash.cloudflare.com/?to=/:account/ai/autorag)
::

## Local Development

During development, `hubAutoRAG()` will call the Cloudflare API. Make sure to run `npx nuxthub link` to create/link a NuxtHub project (even if the project is empty). This project is where your AutoRAG requests will run.

AutoRAG will always run on your Cloudflare account, including during local development. [See pricing on Cloudflare's documentation](https://developers.cloudflare.com/autorag/platform/limits-pricing/).

## `hubAutoRAG()`

`hubAutoRAG()` is a server composable that returns a [AutoRAG instance](https://developers.cloudflare.com/autorag/usage/workers-binding/).

```ts
const autorag = hubAutoRAG("my-autorag")
```

::callout{to="https://developers.cloudflare.com/autorag/usage/workers-binding/"}
This documentation is a small reflection of the [Cloudflare AutoRAG documentation](https://developers.cloudflare.com/autorag/usage/workers-binding/). We recommend reading it to understand the full potential of AutoRAG.
::

### `aiSearch()`

This method searches for relevant results from your data source and generates a response using your default model and the retrieved context, for an AutoRAG named `my-autorag`:

```ts [server/api/autorag-test.ts]
export default defineEventHandler(async () => {
  const autorag = hubAutoRAG("my-autorag") // access AutoRAG instance
  return await autorag.aiSearch({
    query: "How do I create a modal with Nuxt UI?",
    rewrite_query: true,
    max_num_results: 2,
    ranking_options: {
      score_threshold: 0.7,
    },
  })
})
```

#### Options

::field-group
  ::field{name="query" type="string" required}
    The input query.
  ::

  ::field{name="rewrite_query" type="boolean"}
    Rewrites the original query into a search optimized query to improve retrieval accuracy. Defaults to `false`.
  ::

  ::field{name="max_num_results" type="number"}
    The maximum number of results that can be returned from the Vectorize database. Defaults to `10`. Must be between `1` and `50`.
  ::

  ::field{name="ranking_options" type="object"}
    Configurations for customizing result ranking. Defaults to `{}`.
    ::collapsible
      ::field{name="score_threshold" type="number"}
        The minimum match score required for a result to be considered a match. Defaults to `0`. Must be between `0` and `1`.
      ::
    ::
  ::

  ::field{name="stream" type="boolean"}
    Returns a stream of results as they are available. Defaults to `false`.
  ::

  ::field{name="filters" type="object"}
    Narrow down search results based on metadata, like folder and date, so only relevant content is retrieved. For more details, refer to [Metadata filtering](https://developers.cloudflare.com/autorag/configuration/metadata-filtering/).
  ::
::

#### Response

This is the response structure without `stream` enabled.

```json
{
  "object": "vector_store.search_results.page",
  "search_query": "How do I train a llama to deliver coffee?",
  "response": "To train a llama to deliver coffee:\n\n1. **Build trust** — Llamas appreciate patience (and decaf).\n2. **Know limits** — Max 3 cups per llama, per `llama-logistics.md`.\n3. **Use voice commands**\n4. — Start with \"Espresso Express!\"",
  "data": [
    {
      "file_id": "llama001",
      "filename": "docs/llama-logistics.md",
      "score": 0.98,
      "attributes": {},
      "content": [
        {
          "id": "llama001",
          "type": "text",
          "text": "Llamas can carry 3 drinks max."
        }
      ]
    },
    {
      "file_id": "llama042",
      "filename": "docs/llama-commands.md",
      "score": 0.95,
      "attributes": {},
      "content": [
        {
          "id": "llama042",
          "type": "text",
          "text": "Start with basic commands like 'Espresso Express!' Llamas love alliteration."
        }
      ]
    },
  ],
  "has_more": false,
  "next_page": null
}
```

### `search()`

Runs a model. Takes a model as the first parameter, and an object as the second parameter.

```ts [server/api/autorag-test.ts]
export default defineEventHandler(async () => {
  const autorag = hubAutoRAG("my-autorag") // access AutoRAG instance
  return await autorag.search({
    query: "When did I sign my agreement contract?",
    rewrite_query: true,
    max_num_results: 2,
    ranking_options: {
      score_threshold: 0.7,
    },
    filters: {
      type: "eq",
      key: "folder",
      value: "customer-a/contracts/",
    },
  })
})
```

#### Options

::field-group
  ::field{name="query" type="string" required}
    The input query.
  ::

  ::field{name="rewrite_query" type="boolean"}
    Rewrites the original query into a search optimized query to improve retrieval accuracy. Defaults to `false`.
  ::

  ::field{name="max_num_results" type="number"}
    The maximum number of results that can be returned from the Vectorize database. Defaults to `10`. Must be between `1` and `50`.
  ::

  ::field{name="ranking_options" type="object"}
    Configurations for customizing result ranking. Defaults to `{}`.
    ::collapsible
      ::field{name="score_threshold" type="number"}
        The minimum match score required for a result to be considered a match. Defaults to `0`. Must be between `0` and `1`.
      ::
    ::
  ::

  ::field{name="filters" type="object"}
    Narrow down search results based on metadata, like folder and date, so only relevant content is retrieved. For more details, refer to [Metadata filtering](https://developers.cloudflare.com/autorag/configuration/metadata-filtering/).
  ::
::

#### Response

```ts
{
  "object": "vector_store.search_results.page",
  "search_query": "How do I train a llama to deliver coffee?",
  "data": [
    {
      "file_id": "llama001",
      "filename": "docs/llama-logistics.md",
      "score": 0.98,
      "attributes": {},
      "content": [
        {
          "id": "llama001",
          "type": "text",
          "text": "Llamas can carry 3 drinks max."
        }
      ]
    },
    {
      "file_id": "llama042",
      "filename": "docs/llama-commands.md",
      "score": 0.95,
      "attributes": {},
      "content": [
        {
          "id": "llama042",
          "type": "text",
          "text": "Start with basic commands like 'Espresso Express!' Llamas love alliteration."
        }
      ]
    },
  ],
  "has_more": false,
  "next_page": null
}
```

## Supported data sources

AutoRAG sets up and manages your RAG pipeline for you. It connects the tools needed for indexing, retrieval, and generation, and keeps everything up to date by syncing with your data with the index regularly. Once set up, AutoRAG indexes your content in the background and responds to queries in real time.

You can use AutoRAG with the following data sources:
- **Blob**: Upload files to Cloudflare and use them as a data source.
- **Database** (Coming Soon): Connect to a database and use it as a data source.
- **Web Crawler** (Coming Soon): Crawl a website and use it as a data source.
- **Nuxt Content** (Coming Soon): Use Nuxt Content as a data source.

::callout{to="https://developers.cloudflare.com/autorag/configuration/data-source/"}
Learn more about supported data sources and file types in the [AutoRAG documentation](https://developers.cloudflare.com/autorag/configuration/data-source/).
::

## Pricing

During the open beta, AutoRAG is free to enable. When you create an AutoRAG instance, it provisions and runs on top of Cloudflare services in your account. These resources are billed as part of your Cloudflare usage, and includes AI, Blob storage, and Vectorize.

Learn more about pricing in the [AutoRAG documentation](https://developers.cloudflare.com/autorag/platform/limits-pricing/).

:pricing-table{:tabs='["AI"]'}

:pricing-table{:tabs='["Blob"]'}

:pricing-table{:tabs='["Vectorize"]'}
