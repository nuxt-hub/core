---
title: Usage
description: Learn how to store, retrieve, update, and delete key-value pairs in your Nuxt application, with practical examples and best practices.
---

The `hub:kv` module provides access to the Key-Value storage through an [unstorage](https://unstorage.unjs.io) instance.

```ts
import { kv } from 'hub:kv'
```

::tip
`kv` is auto-imported on server-side, you can directly use it without importing it from `hub:kv`.
::

## Set an item

Puts an item in the storage.

```ts
import { kv } from 'hub:kv'

await kv.set('vue', { year: 2014 })

// using prefixes to organize your KV namespace, useful for the `keys` operation
await kv.set('vue:nuxt', { year: 2016 })
```

::note
The maximum size of a value is 25 MiB and the maximum length of a key is 512 bytes.
::

#### Expiration

By default, items in your KV namespace will never expire. You can delete them manually using the [`del()`](#delete-an-item) method or set a TTL (time to live) in seconds.

The item will be deleted after the TTL has expired. The `ttl` option maps to Cloudflare's [`expirationTtl`](https://developers.cloudflare.com/kv/api/write-key-value-pairs/#reference) option. Values that have recently been read will continue to return the cached value for up to 60 seconds and may not be immediately deleted for all regions.

```ts
import { kv } from 'hub:kv'

await kv.set('vue:nuxt', { year: 2016 }, { ttl: 60 })
```

<!--
### Metadata

You can also set metadata on the item.

```ts
await kv.set('vue', { year: 2024 }, {
  metadata: {
    author: 'Evan You'
  }
})
```
-->


## Get an item

Retrieves an item from the Key-Value storage.

```ts
import { kv } from 'hub:kv'

const vue = await kv.get('vue')
/*
{
  year: 2014
}
*/
```


## Has an item

Checks if an item exists in the storage.

```ts
import { kv } from 'hub:kv'

const hasAngular = await kv.has('angular') // false
const hasVue = await kv.has('vue') // true
```

## Delete an item

Delete an item with the given key from the storage.

```ts
import { kv } from 'hub:kv'

await kv.del('react')
```

## Clear the KV namespace

Deletes all items from the KV namespace..

```ts
import { kv } from 'hub:kv'

await kv.clear()
```

To delete all items for a specific prefix, you can pass the prefix as an argument. We recommend using prefixes for better organization in your KV namespace.

```ts
import { kv } from 'hub:kv'

await kv.clear('react')
```

## List all keys

Retrieves all keys from the KV storage.

```ts
import { kv } from 'hub:kv'

const keys = await kv.keys()
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
import { kv } from 'hub:kv'

const vueKeys = await kv.keys('vue')
/*
[
  'vue:nuxt',
  'vue:quasar'
]
*/
```
