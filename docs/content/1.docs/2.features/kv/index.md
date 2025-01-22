---
title: Key Value Storage
navigation.title: Key Value
description: Add a global, low-latency key-value data storage to your Nuxt application.
---
NuxtHub Key Value Storage uses [Unstorage](https://unstorage.unjs.io) with [Cloudflare Workers KV](https://developers.cloudflare.com/kv) to store key-value data.



## Use Cases
- **High Read Volumes**
- **Rate Limiting**
- **Caching**

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

You can inspect your KV namespace during local development in the Nuxt DevTools or after a deployment using the NuxtHub Admin Dashboard.

::tabs
::div{label="Nuxt DevTools"}
:nuxt-img{src="/images/landing/nuxt-devtools-kv.png" alt="Nuxt DevTools KV" width="915" height="515" data-zoom-src="/images/landing/nuxt-devtools-kv.png"}
::
::div{label="NuxtHub Admin"}
:nuxt-img{src="/images/landing/nuxthub-admin-kv.png" alt="NuxtHub Admin KV" width="915" height="515" data-zoom-src="/images/landing/nuxthub-admin-kv.png"}
::
::

## How KV Works

NuxtHub uses [Cloudflare Workers KV](https://developers.cloudflare.com/kv) to store key-value data a few centralized data
centers. Then, when data is requested, it will cache the responses in regional data centers closer to the user to speed up future requests coming from the same region.

This caching means that KV is optimized for high-read use cases, but it also means that changes to data are **eventually consistent** and may take up to 60 seconds to propagate to all regions. (or longer if you set a custom `cacheTTL`). If you need a strongly consistent data model, where changes are immediately visible to all users, a [NuxtHub database](/docs/features/database) may be a better fit.

To learn more about how KV works, check out the [Cloudflare KV documentation](https://developers.cloudflare.com/kv/concepts/how-kv-works/).

## `hubKV()`

`hubKV()` is a server composable that returns an [Unstorage](https://unstorage.unjs.io) instance with [Cloudflare KV binding](https://unstorage.unjs.io/drivers/cloudflare#cloudflare-kv-binding) as the [driver](https://unstorage.unjs.io/drivers/cloudflare).


### Set an item

Puts an item in the storage.

```ts
await hubKV().set('vue', { year: 2014 })
// using prefixes to organize your KV namespace
await hubKV().set('vue:nuxt', { year: 2016 })
```

::note
The maximum size of a value is 25 MiB and the maximum length of a key is 512 bytes.
::

#### Expiration

By default, items in your KV namespace will never expire. You can delete them manually using the [`del()`](#delete-an-item) method or set a TTL (time to live) in seconds.

The item will be deleted after the TTL has expired. This value maps to Cloudflare's [`expirationTtl`](https://developers.cloudflare.com/kv/api/write-key-value-pairs/#reference) option.  

```ts
await hubKV().set('vue:nuxt', { year: 2016 }, { ttl: 60 })
```

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


### Get an item

Retrieves an item from the Key-Value storage.

```ts
const vue = await hubKV().get('vue')
/*
{
  year: 2014
}
*/
```


### Has an item

Checks if an item exists in the storage.

```ts
const hasAngular = await hubKV().has('angular') // false
const hasVue = await hubKV().has('vue') // true
```

### Delete an item

Delete an item from the storage.

```ts
await hubKV().del('react')
```

### Clear the KV namespace

Deletes all items from the KV binding

```ts
await hubKV().clear()
```

### List all keys

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

To get the keys starting with a specific prefix, you can pass the prefix as an argument. We recommend using prefixes for better organization in your KV namespace.

```ts
const vueKeys = await hubKV().keys('vue')
/*
[
  'vue:nuxt',
  'vue:quasar'
]
*/
```

## Limits

- The maximum size of a value is 25 MiB.
- The maximum length of a key is 512 bytes.
- The TTL must be at least 60 seconds.
<!-- - The maximum size of the metadata is 1024 bytes. -->

Learn more about [Cloudflare KV limits](https://developers.cloudflare.com/kv/platform/limits/).

## Learn More

`hubKV()` is an instance of [unstorage](https://unstorage.unjs.io/guide#interface) with the [Cloudflare KV binding](https://unstorage.unjs.io/drivers/cloudflare#cloudflare-kv-binding) driver.

## Pricing

:pricing-table{:tabs='["KV"]'}
