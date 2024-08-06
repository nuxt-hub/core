---
title: Introducing hubAI()
description: "Run machine learning models, such as LLMs in your Nuxt application, with minimal setup."
date: 2024-08-06
image: '/images/changelog/hub-ai.png'
category: Admin
authors:
  - name: Sebastien Chopin
    avatar: 
      src: https://avatars.githubusercontent.com/u/904724?v=4
    to: https://x.com/atinux
    username: atinux
  - name: Rihan Arfan
    avatar: 
      src: https://avatars.githubusercontent.com/u/20425781?v=4
    to: https://x.com/RihanArfan
    username: RihanArfan
---

::tip
This feature is available on both [free and pro plans](/pricing).
::

We are excited to introduce [`hubAI()`](/docs/features/ai). This new method allows you to run machine learning models, such as LLMs, directly within your Nuxt application with minimal setup.

At NuxtHub, we care about DX and we want to make it easy for you to leverage AI in your application using Cloudflare AI without having to manage API keys, account ID or using the `wrangler` CLI.

::note
**If you already have a NuxtHub account**, make sure to add the `Worker AI` permission on your Cloudflare API token.

- Open [Cloudflare User API Tokens](https://dash.cloudflare.com/profile/api-tokens)
- Find the NuxtHub token(s)
- Add the `Account > Worker AI > Read` permission
- Save the changes

Another solution is to link again your Cloudflare account from your NuxtHub team settings by clicking on `Link a new account` > `Create a token with required permissions`.
::

## How to use hubAI()

1. Update `@nuxthub/core` to the latest version

2. Enable `hub.ai` in your `nuxt.config.ts`

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    ai: true
  },
})
```

3. Run `npx nuxthub link` to link a NuxtHub project or create a new one

4. That's it! You can now use [`hubAI()`](/docs/features/ai) in your Nuxt application.

## Example

This example creates a `/api/ai-test` route that generates a response from a model.

```ts [server/api/ai-test.ts]
export default defineEventHandler(async (event) => {
  return await hubAI().run('@cf/meta/llama-3.1-8b-instruct', {
    prompt: 'Who is the author of Nuxt?'
  })
})
```

Read the [full documentation](/docs/features/ai) to learn more about `hubAI()`.

::callout
This feature has been implemented in [nuxt-hub/core#173](https://github.com/nuxt-hub/core/pull/173).
::

