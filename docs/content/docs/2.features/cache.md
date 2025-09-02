---
title: Cache Pages, API & Functions
navigation.title: Cache
description: Learn how to cache Nuxt pages, API routes and functions in with NuxtHub cache storage.
---

NuxtHub Cache is powered by [Nitro's cache storage](https://nitro.build/guide/cache#customize-cache-storage). It allows you to cache API routes, server functions, and pages in your application.

## Getting Started

1. Enable the cache storage in your NuxtHub project by adding the `cache` property to the `hub` object in your `nuxt.config.ts` file.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    cache: true
  }
})
```

2. Configure your production storage provider in Nitro

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  nitro: {
    storage: {
      cache: {
        driver: 'vercel-runtime-cache',
        /* any additional connector options */
      }
    }
  },

  hub: {
    cache: true,
  },
})
```

::callout{to="https://nitro.build/guide/storage#configuration"}
You can find the driver list on [unstorage documentation](https://unstorage.unjs.io/drivers) with their configuration.
::

By default, NuxtHub will automatically use the filesystem during local development. You can modify this behaviour by specifying a different storage driver.
::collapsible{name="local development storage driver example"}
```ts [nuxt.config.ts]
export default defineNuxtConfig({
  nitro: {
    // default cache driver
    devStorage: {
      cache: {
        driver: 'fs',
        base: join(nuxt.options.rootDir, '.data/cache')
      }
    }
  },
})
```
::

## API Routes Caching

To cache Nuxt API and server routes, use the `cachedEventHandler` function. This function will cache the response of the server route into the cache storage.

```ts [server/api/cached-route.ts]
import type { H3Event } from 'h3'

export default cachedEventHandler((event) => {
  return {
    success: true,
    date: new Date().toISOString()
  }
}, {
  maxAge: 60 * 60, // 1 hour
  getKey: (event: H3Event) => event.path
})
```

The above example will cache the response of the `/api/cached-route` route for 1 hour. The `getKey` function is used to generate the key for the cache entry.

::note{to="https://nitro.build/guide/cache#options"}
Read more about [Nitro Cache options](https://nitro.build/guide/cache#options).
::

## Server Functions Caching

Using the `cachedFunction` function, You can cache the response of a server function based on the arguments passed to the function.

::tip
This is useful to cache the result of a function used in multiple API routes or within authenticated routes.
::


```ts [server/utils/cached-function.ts]
import type { H3Event } from 'h3'

export const getRepoStarCached = defineCachedFunction(async (event: H3Event, repo: string) => {
  const data: any = await $fetch(`https://api.github.com/repos/${repo}`)

  return data.stargazers_count
}, {
  maxAge: 60 * 60, // 1 hour
  name: 'ghStars',
  getKey: (event: H3Event, repo: string) => repo
})
```

The above example will cache the result of the `getRepoStarCached` function for 1 hour.

::important
It is important to note that the `event` argument should always be the first argument of the cached function. Nitro leverages `event.waitUntil` to keep the instance alive while the cache is being updated while the response is sent to the client.
:br
[Read more about this in the Nitro docs](https://nitro.build/guide/cache#edge-workers).
::

## Routes Caching

You can enable route caching in your `nuxt.config.ts` file.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  routeRules: {
    '/blog/**': {
      cache: {
        maxAge: 60 * 60,
        // other options like name, group, swr...
      }
    }
  }
})
```

::note
Read more about [Nuxt's route rules](https://nuxt.com/docs/guide/concepts/rendering#hybrid-rendering).
::

## Cache Invalidation

When using the `defineCachedFunction` or `defineCachedEventHandler` functions, the cache key is generated using the following pattern:

```ts
`${options.group}:${options.name}:${options.getKey(...args)}.json`
```

The defaults are:
- `group`: `'nitro'`
- `name`: `'handlers'` for API routes,  `'functions'` for server functions, or `'routes'` for route handlers

For example, the following function:

```ts
const getAccessToken = defineCachedFunction(() => {
  return String(Date.now())
}, {
  maxAge: 60,
  name: 'getAccessToken',
  getKey: () => 'default'
})
```

Will generate the following cache key:

```ts
nitro:functions:getAccessToken:default.json
```

You can invalidate the cached function entry from your storage using cache key.

```ts
await useStorage('cache').removeItem('nitro:functions:getAccessToken:default.json')
```

You can use the `group` and `name` options to invalidate multiple cache entries based on their prefixes.

```ts
// Gets all keys that start with nitro:handlers
await useStorage('cache').clear('nitro:handlers')
```


::note{to="https://nitro.build/guide/cache"}
Read more about Nitro Cache.
::

### Normalizing Cache Keys

::important
**Cache keys are automatically normalized** using an internal utility that removes non-alphanumeric characters such as `/` and `-`. This behavior helps ensure compatibility across various storage backends (e.g., `file systems`, `key-value` stores) that might have restrictions on characters in `keys`, and also prevents potential path traversal vulnerabilities.
::

For example:

```ts
getKey: () => '/api/products/sale-items'
```

Would generate a key like:

```ts
api/productssaleitems.json
```

This behavior may result in keys that look different from the original route or identifier.

::tip
To manually reproduce the same normalized key pattern used by Nitro (e.g., when invalidating cache entries), you can use the `escapeKey` utility function provided below:
::

```ts
function escapeKey(key: string | string[]) {
  return String(key).replace(/\W/g, "");
}
```

It's recommended to use `escapeKey()` when invalidating manually using route paths or identifiers to ensure consistency with Nitro's internal key generation.

For example, if your `getKey` function is:

```ts
getKey: (id: string) => `product/${id}/details`
```

And you want to invalidate `product/123/details`, you would do:

```ts
const normalizedKey = escapeKey('product/123/details')
await useStorage('cache').removeItem(`nitro:functions:getProductDetails:${normalizedKey}.json`)
```

## Cache Expiration

As NuxtHub leverages Cloudflare Workers KV to store your cache entries, we leverage the [`expiration` property](https://developers.cloudflare.com/kv/api/write-key-value-pairs/#expiring-keys) of the KV binding to handle the cache expiration.

By default, `stale-while-revalidate` behavior is enabled. If an expired cache entry is requested, the stale value will be served while the cache is asynchronously refreshed. This also means that all cache entries will remain in your KV namespace until they are manually invalidated/deleted.

To disable this behavior, set `swr` to `false` when defining a cache rule. This will delete the cache entry once `maxAge` is reached.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  nitro: {
    routeRules: {
      '/blog/**': {
        cache: {
          maxAge: 60 * 60,
          swr: false
          // other options like name and group...
        }
      }
  }
})
```

::note
If you set an expiration (`maxAge`) lower than `60` seconds, NuxtHub will set the KV entry expiration to `60` seconds in the future so it can be removed automatically on providers that do not support TTLs lower than 60s.
::
