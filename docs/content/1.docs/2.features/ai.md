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

## Templates

Explore open source templates made by the community:

::card-group
  ::card{title="Atidraw" to="https://github.com/atinux/atidraw"}
  Generate the alt text of the user drawing and generate an alternative image with AI.
  ::
  ::card{title="Hub Chat" to="https://github.com/ra-jeev/hub-chat"}
  A chat interface to interact with various text generation AI models.
  ::
::

## Vercel AI SDK

It is possible to use the Vercel AI SDK with Cloudflare Workers AI.

NuxtHub AI is compatible with some functions of the  [Vercel AI SDK](https://sdk.vercel.ai), which enables streaming responses.

Make sure to install the Vercel AI SDK in your project.

```[Terminal]
npx ni ai @ai-sdk/vue
```

::note
[`ni`](https://github.com/antfu/ni) will detect your package manager and install the dependencies with it.
::

### `useChat()`

To leverage the `useChat()` Vue composable, you need to create a `POST /api/chat` endpoint that uses the `hubAI()` server composable and returns a compatible stream for the Vercel AI SDK.

```ts [server/api/chat.post.ts]
import { AIStream, formatStreamPart } from 'ai'

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)

  const stream = await hubAI().run('@cf/meta/llama-3.1-8b-instruct', {
    messages,
    stream: true
  }) as ReadableStream

  // Return a compatible stream for the Vercel AI SDK
  return AIStream(
    new Response(stream),
    data => formatStreamPart('text', JSON.parse(data).response)
  )
})
```

Then, we can create a chat component that uses the `useChat()` composable.

```vue [app/pages/chat.vue]
<script setup lang="ts">
import { useChat } from '@ai-sdk/vue'

const { messages, input, handleSubmit, isLoading, stop, error, reload } = useChat()
</script>

<template>
  <div v-for="m in messages" :key="m.id">
    {{ m.role }}: {{ m.content }}
  </div>
  <div v-if="error">
    <div>{{ error.message || 'An error occurred' }}</div>
    <button @click="reload">retry</button>
  </div>
  <form @submit="handleSubmit">
    <input v-model="input" placeholder="Type here..." />
    <button v-if="isLoading" @click="stop">stop</button>
    <button v-else type="submit">send</button>
  </form>
</template>
```

Learn more about the [`useChat()` Vue composable](https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat).

::callout
Check out our [`pages/ai.vue` full example](https://github.com/nuxt-hub/core/blob/main/playground/app/pages/ai.vue) with Nuxt UI & Nuxt MDC.
::
