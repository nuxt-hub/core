---
title: Open API Documentation
navigation.title: Open API
description: Generate an Open API documentation for your Nuxt project with Scalar.
---

## Getting Started

During development, you can use Nuxt DevTools to access your API routes using the `Open API` or  `Server Routes` tabs.

List all API routes in your project, and use the playground to test your endpoints.

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

::tabs
::div{label="Server Routes"}
:img{src="/images/landing/nuxt-devtools-api-routes.png" alt="NuxtHub API Routes" width="915" height="515"}
::
::div{label="OpenAPI"}
<!-- TODO: screenshot of scalar -->
:img{src="/images/landing/nuxt-devtools-api-routes.png" alt="Nuxt Open API Scalar integration" width="915" height="515"}
::
::

## Set Meta

You can modify your OpenAPI specification by passing `openAPI` to `nitro` within your `nuxt.config.ts`.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  nitro: {
    openAPI: {
      meta: {
        title: 'My Awesome Project',
        description: 'This might become the next big thing.',
        version: '1.0'
      }
    }
  },
})
```

## Set Route Meta

You can define route handler meta (at build time) using the `defineRouteMeta` macro:

```ts [pages/api/ok.ts]
defineRouteMeta({
  openAPI: {
    description: 'Test route description',
    parameters: [{ in: "query", name: "test", required: true }],
  },
});

export default defineEventHandler(() => "OK");
```

::note{to="https://swagger.io/specification/v3/"}
See the OpenAPI specification for available options.
::
