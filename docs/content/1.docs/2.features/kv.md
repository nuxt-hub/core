---
title: Key Value Storage
navigation.title: Key Value
description: Add a key-value data storage to your Nuxt application.
---

## Getting Started

Enable the key-value storage in your NuxtHub project by adding the `kv` property to the `hub` object in your `nuxt.config.ts` file.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    kv: true
  }
})
```

::note
This option will use Cloudflare platform proxy in development and automatically create a [Cloudflare Workers KV](https://developers.cloudflare.com/kv) namespace for your project when you [deploy it](/docs/getting-started/deploy).
::

::tabs
::div{label="Nuxt DevTools"}
:nuxt-img{src="/images/landing/nuxt-devtools-kv.png" alt="Nuxt Devtools KV" width="915" height="515" class="!m-0"}
::
::div{label="NuxtHub Admin"}
:nuxt-img{src="/images/landing/nuxthub-admin-kv.png" alt="NuxtHub Admin KV" width="915" height="515" class="!m-0"}
::
::

## `hubKV()`

Server method that returns an [unstorage instance](https://unstorage.unjs.io/guide#interface) with `keys()`, `get()`, `set()` and `del()` aliases.

### `keys()`

Retrieves all keys from the KV storage (alias of `getKeys()`).

```ts
const keys = await hubKV().keys()
/*
[
  'react',
  'react:gatsby',
  'react:next',
  'vue',
  'vue:nuxt',
  'vue:quasar'
]
```

To get the keys starting with a specific prefix, you can pass the prefix as an argument.

```ts
const vueKeys = await hubKV().keys('vue')
/*
[
  'vue:nuxt',
  'vue:quasar'
]
*/
```

### `get()`

Retrieves an item from the Key-Value storage (alias of `getItem()`).

```ts
const vue = await hubKV().get('vue')
/*
{
  year: 2014
}
*/
```

### `set()`

Puts an item in the storage (alias of `setItem()`)

```ts
await hubKV().set('vue', { year: 2014 })
```

You can delimit the key with a `:` to create a namespace:

```ts
await hubKV().set('vue:nuxt', { year: 2016 })
```

### `has()`

Checks if an item exists in the storage (alias of `hasItem()`)

```ts
const hasAngular = await hubKV().has('angular')
```

### `del()`

Delete an item from the storage (alias of `removeItem()`)

```ts
await hubKV().del('react')
```

### `...()`

::callout
You can use any other method from [unstorage](https://unstorage.unjs.io/guide#interface) as well.
::
