---
title: Run AI Models
navigation.title: AI
description: Run machine learning models, such as LLMs in Nuxt. Making the usage of AI models in your Nuxt application easy.
---

## Getting Started

Enable AI in your NuxtHub project by adding the `ai` property to the `hub` object in your `nuxt.config.ts` file.

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

::important
During development, `hubAI()` needs to call the Cloudflare API as it is not running inside a worker. Make sure to run `npx nuxthub link` to create/link a NuxtHub project (even if the project is empty).
::

::warning{to="https://developers.cloudflare.com/workers-ai/platform/pricing/"}
NuxtHub AI will run AI models on your Cloudflare account, including during local development. :br [See pricing and included free quotas on Cloudflare's documentation](https://developers.cloudflare.com/workers-ai/platform/pricing/).
::

## hubAI()

Server composable that returns a [Workers AI client](https://developers.cloudflare.com/workers-ai/configuration/bindings/#methods).

```ts
const ai = hubAI()
```

::callout
This documentation is a small reflection of the [Cloudflare Workers AI documentation](https://developers.cloudflare.com/workers-ai/configuration/bindings/#methods). We recommend reading it to understand the full potential of Workers AI.
::

### `run()`

Runs a model. Takes a model as the first parameter, and an object as the second parameter.

```ts [server/api/ai-test.ts]
export default defineEventHandler(async () => {
  const ai = hubAI() // access AI bindings
  return await ai.run('@cf/meta/llama-3.1-8b-instruct', {
    prompt: 'Who is the author of Nuxt?'
  })
})
```

#### Options

::field-group
  ::field{name="model" type="string" required}
    The model to run
  ::

  ::field{name="options" type="object"}
    The model options.
    ::collapsible
      ::field{name="...modelOptions" type="any"}
      ::field{name="stream" type="boolean"}
    ::
  ::

  ::field{name="ai gateway" type="object"}
    See [`AI Gateway`](#ai-gateway) for details.
  ::
::


## Models

Workers AI comes with a curated set of popular open-source models that enable you to do tasks such as image classification, text generation, object detection and more.

:u-button{icon="i-ph-arrow-square-out" trailing to="https://developers.cloudflare.com/workers-ai/models/" target="_blank" label="See all Workers AI models"}

## Streaming

The recommended method to handle text generation responses is streaming.

LLMs work internally by generating responses sequentially using a process of repeated inference — the full output of a LLM model is essentially a sequence of hundreds or thousands of individual prediction tasks. For this reason, while it only takes a few milliseconds to generate a single token, generating the full response takes longer, on the order of seconds.

You can use streaming to start displaying the response as soon as the first tokens are generated, and append each additional token until the response is complete. This yields a much better experience for the end user. Displaying text incrementally as it’s generated not only provides instant responsiveness, but also gives the end-user time to read and interpret the text.

To enable, set the `stream` parameter to `true`.

You can check if the model you're using support streaming on [Cloudflare's models documentation](https://developers.cloudflare.com/workers-ai/models/#text-generation).

```ts
export default defineEventHandler(async (event) => {
  const messages = [
    { role: 'system', content: 'You are a friendly assistant' },
    { role: 'user', content: 'What is the origin of the phrase Hello, World' }
  ]

  const ai = hubAI()
  const stream = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
    stream: true,
    messages
  })
  return sendStream(event, stream)
})
```

## AI Gateway

Workers AI is compatible with AI Gateway, which enables caching responses, analytics, real-time logging, ratelimiting, and fallback providers. Learn more about [AI Gateway](https://developers.cloudflare.com/ai-gateway/).

### Options

Configure options for AI Gateway by passing an additional object to `hubAI().run()`, [learn more on Cloudflare's docs](https://developers.cloudflare.com/ai-gateway/providers/workersai/#worker).

```ts [server/api/who-created-nuxt.get.ts]
export default defineEventHandler(async () => {
  const ai = hubAI()
  return await ai.run('@cf/meta/llama-3-8b-instruct',
    {
      prompt: 'Who is the creator of Nuxt?'
    },
    {
      gateway: {
        id: '{gateway_slug}',
        skipCache: false,
        cacheTtl: 3360
      }
    })
})
```

::field-group
  ::field{name="id" type="string"}
    Name of your existing [AI Gateway](https://developers.cloudflare.com/ai-gateway/get-started/#create-gateway). Must be in the same Cloudflare account as your NuxtHub application.
  ::

  ::field{name="skipCache" type="boolean" default="false"}
    Controls whether the request should [skip the cache](https://developers.cloudflare.com/ai-gateway/configuration/caching/#skip-cache-cf-skip-cache).
  ::

  ::field{name="cacheTtl" type="number"}
    Controls the [Cache TTL](https://developers.cloudflare.com/ai-gateway/configuration/caching/#cache-ttl-cf-cache-ttl).
  ::
::
