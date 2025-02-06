---
title: Run AI Models
navigation.title: AI
description: Run machine learning models, such as LLMs, in Nuxt.
---

NuxtHub AI lets you integrate machine learning models into your Nuxt application. Built on top of [Workers AI](https://developers.cloudflare.com/workers-ai/), it provides a simple and intuitive API that supports models for text generation, image generation, embeddings, and more.

::code-group

```ts [text.ts]
const response = await hubAI().run('@cf/meta/llama-3.1-8b-instruct', {
  prompt: 'Who is the author of Nuxt?'
})
```

```ts [image.ts]
const response = await hubAI().run('@cf/runwayml/stable-diffusion-v1-5-img2img', {
  prompt: 'A sunset over the ocean.',
})
```

```ts [embeddings.ts]
// returns embeddings that can be used for vector searches in tools like Vectorize
const embeddings = await hubAI().run("@cf/baai/bge-base-en-v1.5", { 
  text: "NuxtHub AI uses `hubAI()` to run models."  
});
```
::

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

### Local Development

During development, `hubAI()` will call the Cloudflare API. Make sure to run `npx nuxthub link` to create/link a NuxtHub project (even if the project is empty). This project is where your AI models will run.

NuxtHub AI will always run AI models on your Cloudflare account, including during local development. [See pricing and included free quotas on Cloudflare's documentation](https://developers.cloudflare.com/workers-ai/platform/pricing/).


## Models

Workers AI comes with a curated set of popular open-source models that enable you to do tasks such as image classification, text generation, object detection, and more.

:u-button{icon="i-lucide-arrow-up-right" trailing to="https://developers.cloudflare.com/workers-ai/models/" target="_blank" label="See all Workers AI models"}

## hubAI()

`hubAI()` is a server composable that returns a [Workers AI client](https://developers.cloudflare.com/workers-ai/configuration/bindings/#methods).

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
      Options for the model you choose can be found in the [Worker AI's models documentation](https://developers.cloudflare.com/workers-ai/models/).
      ::field{name="stream" type="boolean"}
      Whether results should be [streamed](#streaming-responses) as they are generated.
    ::
  ::

  ::field{name="AI Gateway" type="object"}
    Options for configuring [`AI Gateway`](#ai-gateway) - `id`, `skipCache`, and `cacheTtl`. 
  ::
::


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
    Controls the [Cache TTL](https://developers.cloudflare.com/ai-gateway/configuration/caching/#cache-ttl-cf-cache-ttl), the duration (in seconds) that a cached request will be valid for. The minimum TTL is 60 seconds and maximum is one month. 
  ::
::

## Streaming

The recommended method to handle text generation responses is streaming.

LLMs work internally by generating responses sequentially using a process of repeated inference — the full output of a LLM model is essentially a sequence of hundreds or thousands of individual prediction tasks. For this reason, while it only takes a few milliseconds to generate a single token, generating the full response takes longer.

If your UI waits for the entire response to be generated, a user may see a loading spinner for several seconds before the response is displayed. 

Streaming lets you start displaying the response as soon as the first tokens are generated, and append each additional token until the response is complete. This yields a much better experience for the end user. Displaying text incrementally as it’s generated not only provides instant responsiveness, but also gives the end-user time to read and interpret the text.

To enable, set the `stream` parameter to `true`.

You can check if the model you're using supports streaming on [Cloudflare's models documentation](https://developers.cloudflare.com/workers-ai/models/#text-generation).

```ts
export default defineEventHandler(async (event) => {
  const messages = [
    { role: 'system', content: 'You are a friendly assistant' },
    { role: 'user', content: 'What is the origin of the phrase Hello, World?' }
  ]

  const ai = hubAI()
  const stream = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
    stream: true,
    messages
  })
  return stream
})
```

### Handling Streaming Responses

To manually handle streaming responses, you can use [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) and Nuxt's `$fetch` function to create a new `ReadableStream` from the response.

Creating a reader allows you to process the stream in chunks as it's received.

```ts
const response = await $fetch<ReadableStream>('/api/chats/ask-ai', {
  method: 'POST',
  body: {
    query: "Hello AI, how are you?",
  },
  responseType: 'stream',
})

// Create a new ReadableStream from the response with TextDecoderStream to get the data as text
const reader = response.pipeThrough(new TextDecoderStream()).getReader()

// Read the chunks of data as they're received
while (true) {
  const { value, done } = await reader.read()

  if (done)
    break

  console.log('Received:', value)
}
```


## Vercel AI SDK

Another way to handle streaming responses is to use [Vercel's AI SDK](https://sdk.vercel.ai/) with `hubAI()`.

This uses the [Workers AI Provider](https://sdk.vercel.ai/providers/community-providers/cloudflare-workers-ai), which supports a subset of Vercel AI features.

::callout
`tools` and `streamObject` are currently not supported.
::

To get started, install the Vercel AI SDK and the Cloudflare AI Provider in your project.

```[Terminal]
npx nypm i ai @ai-sdk/vue workers-ai-provider
```

::note
[`nypm`](https://github.com/unjs/nypm) will detect your package manager and install the dependencies with it.
::

### `useChat()`

`useChat()` is a Vue composable provided by the Vercel AI SDK that handles streaming responses, API calls, state for your chat. 

It requires a `POST /api/chat` endpoint that uses the `hubAI()` server composable and returns a compatible stream for the Vercel AI SDK.

```ts [server/api/chat.post.ts]
import { streamText } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)

  const workersAI = createWorkersAI({ binding: hubAI() })

  return streamText({
    model: workersAI('@cf/meta/llama-3.1-8b-instruct'),
    messages
  }).toDataStreamResponse()
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

Learn more about the [`useChat()` composable](https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat).

::callout
Check out our [`pages/ai.vue` full example](https://github.com/nuxt-hub/core/blob/main/playground/app/pages/ai.vue) with Nuxt UI & [Nuxt MDC](https://github.com/nuxt-modules/mdc).
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


## Pricing 

:pricing-table{:tabs='["AI"]'}
