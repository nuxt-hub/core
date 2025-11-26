---
title: Run AI Models
navigation.title: AI
description: Run machine learning models, such as LLMs, in Nuxt.
---

NuxtHub AI makes integrating AI models such as text generation, image generation, embeddings, and more into your Nuxt application simple and intuitive via [AI SDK](https://ai-sdk.dev/).

## Getting Started

1. Enable AI in NuxtHub by setting the `ai` property to your provider in `hub` within your `nuxt.config.ts` file.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    ai: 'vercel' // or 'cloudflare'
  }
})
```

2. Install the `ai` package

:pm-install{name="ai"}

3. Authenticate with the AI provider.

::tabs
  :::div{label="Vercel AI Gateway" icon="i-simple-icons-vercel"}

    Generate an API key from the [Vercel AI Gateway dashboard](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%2Fapi-keys).

    Set the `AI_GATEWAY_API_KEY` environment variable to configure AI Gateway.

    ```bash [.env]
    AI_GATEWAY_API_KEY=your-api-key
    ```

    Alternatively, if you manage local environment variables on Vercel, you can run `npx vercel env pull .env` to authenticate using OIDC for 12 hours.

  :::

  :::div{label="Workers AI" icon="i-simple-icons-cloudflare"}

    ::callout{to="https://dash.cloudflare.com/?to=/:account/api-tokens?name=NuxtHub"}
      Generate an API key with the `Workers AI` read scope from the Cloudflare dashboard.
    ::

    Set the `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_KEY` environment variables to configure Cloudflare Workers AI.

    ```bash [.env]
    CLOUDFLARE_ACCOUNT_ID=your-account-id
    CLOUDFLARE_API_KEY=your-api-key
    ```

  :::
::


### Automatic Configuration

When building the Nuxt app, NuxtHub automatically configures the specified AI provider on many providers.

::tabs
  :::div{label="Vercel" icon="i-simple-icons-vercel"}

    ::tabs
      :::div{label="Vercel AI Gateway" icon="i-simple-icons-vercel"}

        1. Install the `@ai-sdk/gateway` package

        :pm-install{name="@ai-sdk/gateway"}

        2. Vercel AI Gateway is automatically configured when deploying to Vercel.

      :::

      :::div{label="Workers AI" icon="i-simple-icons-cloudflare"}

        1. Install the `workers-ai-provider` package

        :pm-install{name="workers-ai-provider"}

        2. Set the `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_KEY` environment variables to configure Cloudflare Workers AI.

      :::
    ::

  :::

  :::div{label="Cloudflare" icon="i-simple-icons-cloudflare"}

    ::tabs
      :::div{label="Vercel AI Gateway" icon="i-simple-icons-vercel"}

        1. Install the `@ai-sdk/gateway` package

        :pm-install{name="@ai-sdk/gateway"}

        2. Set the `AI_GATEWAY_API_KEY` environment variable to configure AI Gateway.

      :::

      :::div{label="Workers AI" icon="i-simple-icons-cloudflare"}

        1. Install the `workers-ai-provider` package

        :pm-install{name="workers-ai-provider"}

        2. Add an `AI` binding to Workers AI in your wrangler.jsonc config.

        ```json [wrangler.jsonc]
        {
          "$schema": "node_modules/wrangler/config-schema.json",
          // ...
          "ai": {
            "binding": "AI"
          }
        }
        ```

      :::
    ::

  :::

  :::div{label="Other" icon="i-simple-icons-nodedotjs"}

    ::tabs
      :::div{label="Vercel AI Gateway" icon="i-simple-icons-vercel"}

        1. Install the `@ai-sdk/gateway` package

        :pm-install{name="@ai-sdk/gateway"}

        2. Set the `AI_GATEWAY_API_KEY` environment variable to configure AI Gateway.

      :::

      :::div{label="Workers AI" icon="i-simple-icons-cloudflare"}

        1. Install the `workers-ai-provider` package

        :pm-install{name="workers-ai-provider"}

        2. Set the `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_KEY` environment variables to configure Cloudflare Workers AI.

      :::
    ::

  :::
::

## Usage

`hubAI()` provides pre-configured AI SDK provider either of Vercel AI Gateway or Cloudflare Workers AI.

Use `hubAI()` when passing a model to to [AI SDK](https://ai-sdk.dev/).

```ts
const result = streamText({
  // When using Vercel AI Gateway
  model: hubAI('mistral/mistral-large'),
  // When using Cloudflare Workers AI
  model: hubAI('@cf/meta/llama-3.3-70b-instruct-fp8-fast'),

  prompt: 'Who created Nuxt?',
});
```

::callout{to="https://ai-sdk.dev/docs/ai-sdk-core/overview"}
Learn more about AI SDK on their documentation.
::

## Models

::tabs
  :::div{label="Vercel AI Gateway" icon="i-simple-icons-vercel"}
    ::callout{to="https://vercel.com/ai-gateway/models"}
      See all supported models on the Vercel AI Gateway documentation.
    ::
  :::

  :::div{label="Workers AI" icon="i-simple-icons-cloudflare"}
    ::callout{to="https://developers.cloudflare.com/workers-ai/models/"}
      See all supported models on the Cloudflare Workers AI documentation.
    ::
  :::
::

## Examples

- [Nuxt UI Chat template](https://github.com/nuxt-ui-templates/chat)
