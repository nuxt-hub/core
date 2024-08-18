---
title: Open API Documentation
navigation.title: Open API
description: Generate an Open API documentation for your Nuxt project with Scalar.
---

::warning
Hi Chopin Fam & Friends,  when I read 'openAPI', I first thought of OpenAI... as it is so close and if documentation and referrals abound on the web in time, I think there may be confusion or it would get lost.  I understand the convention and think I know the meaning as a beginner.  I wonder if other names might also work?  Ones that comes to mind are 'templateAPIs' or 'templateAPI'.  Other options might be 'standardAPI', 'quickAPIs' (double meaning... all Nuxt is quick) or 'carbonAPI' (double meaning... carbon-copy and hard/bullet proof).  I notice you haven't 'sub-branded' any of the other products, so... tempalteAPIs, might be better?).  Passing on as food for thought... ... ... now that I have re-read it many times, I understand it isn't OpenAI and so that is also good.  Thanks. NH.
::


::warning
This is currently experimental and subject to change in the future.
::

## Getting Started

NuxtHub uses Nitro's OpenAPI generation to access your Nuxt project's API.

To enable the API, you need to add enable Nitro's experimental `openAPI` feature. You can do this by adding the `nitro.experimental.openAPI` property to your `nuxt.config.ts` file.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  nitro: {
    experimental: {
      openAPI: true
    }
  }
})
```

After you deploy your project, NuxtHub Admin will showcase your API documentation using [Scalar](https://scalar.com).

:nuxt-img{src="/images/landing/nuxthub-admin-open-api.png" alt="Nuxt Open API Scalar integration" width="915" height="515" data-zoom-src="/images/landing/nuxthub-admin-open-api.png"}

## Nuxt DevTools

In development, you can use Nuxt DevTools to access your API routes. using the `Server Routes` tab.

It list all the API routes in your project as well as providing a playground to send and test your endpoints.

Check out the [Nuxt DevTools](https://devtools.nuxt.com/) documentation for more information.

:nuxt-img{src="/images/landing/nuxt-devtools-api-routes.png" alt="NuxtHub Admin Cache" width="915" height="515" data-zoom-src="/images/landing/nuxt-devtools-api-routes.png"}
