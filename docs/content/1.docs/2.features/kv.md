---
title: Key Value Storage
navigation.title: Key Value
description: Add a global, low-latency key-value data storage to your Nuxt application.
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
:nuxt-img{src="/images/landing/nuxt-devtools-kv.png" alt="Nuxt DevTools KV" width="915" height="515" data-zoom-src="/images/landing/nuxt-devtools-kv.png"}
::
::div{label="NuxtHub Admin"}
:nuxt-img{src="/images/landing/nuxthub-admin-kv.png" alt="NuxtHub Admin KV" width="915" height="515" data-zoom-src="/images/landing/nuxthub-admin-kv.png"}
::
::

## List all keys

Retrieves all keys from the KV storage.

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

::important
We recommend to use prefixes for better organization and performance as `keys()` will scan the entire namespace.
::

## Get an item

Retrieves an item from the Key-Value storage.

```ts
const vue = await hubKV().get('vue')
/*
{
  year: 2014
}
*/
```

## Set an item

Puts an item in the storage.

```ts
await hubKV().set('vue', { year: 2014 })
```

You can delimit the key with a `:` to create a namespace:

```ts
await hubKV().set('vue:nuxt', { year: 2016 })
```

::note
The maximum size of a value is 25 MiB and the maximum length of a key is 512 bytes.
::

### Expiration

You can also set a TTL (time to live) in seconds:

```ts
await hubKV().set('vue:nuxt', { year: 2016 }, { ttl: 60 })
```

The item will be deleted after the TTL has expired.

<!--
If you prefer to specify the expiration date, you can use the `expiration` option:

```ts
const timestampIn2024 = new Date('2042-01-01').getTime() / 1000
await hubKV().set('vue:nuxt', { year: 2016 }, { expiration: timestampIn2024 })
```

### Metadata

You can also set metadata on the item.

```ts
await hubKV().set('vue', { year: 2024 }, {
  metadata: {
    author: 'Evan You'
  }
})
```
-->

## Has an item

Checks if an item exists in the storage.

```ts
const hasAngular = await hubKV().has('angular')
```

## Delete an item

Delete an item from the storage.

```ts
await hubKV().del('react')
```

## Limits

- The maximum size of a value is 25 MiB.
- The maximum length of a key is 512 bytes.
- The TTL must be at least 60 seconds.
<!-- - The maximum size of the metadata is 1024 bytes. -->

Learn more about [Cloudflare KV limits](https://developers.cloudflare.com/kv/platform/limits/).

## Learn More

`hubKV()` is an instance of [unstorage](https://unstorage.unjs.io/guide#interface) with the [Cloudflare KV binding](https://unstorage.unjs.io/drivers/cloudflare#cloudflare-kv-binding) driver.
