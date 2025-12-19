---
title: "Build full-stack Nuxt applications."
navigation: false
description: "Build full-stack Nuxt applications, with zero configuration. NuxtHub supercharges your Nuxt development workflow so you can focus on shipping features."
seo:
  ogImage: '/social-card.png'
---

::u-page-hero
---
orientation: 'horizontal'
ui:
  container: 'lg:items-start'
---
#headline
  :::u-button
  ---
  size: sm
  to: /changelog/nuxthub-multi-vendor
  variant: outline
  trailing-icon: i-lucide-arrow-right
  ---
  NuxtHub multi-vendor is now available
  :::

#title
Build [full-stack]{.text-primary} Nuxt apps.

#description
NuxtHub is a Nuxt module giving you all the features required to ship full-stack applications, with no vendor lock-in.

#links
  :::u-button
  ---
  size: lg
  to: /docs/getting-started/installation
  trailing-icon: i-lucide-arrow-right
  ---
  Get started
  :::

  :u-input-copy{value="npx nuxt module add hub"}


#default
::tabs{class="xl:-mt-10"}
:::tabs-item{label="Database" icon="i-lucide-database"}
```ts
import { eq, desc } from 'drizzle-orm'
import { db, schema } from 'hub:db'

// Type-safe queries with Drizzle ORM
const todos = await db.query.todos.findMany({
  where: eq(schema.todos.completed, false),
  orderBy: [desc(schema.todos.createdAt)]
})

// Insert with automatic type inference
await db.insert(schema.todos).values({
  title: 'Ship my app',
  completed: false,
})
```
:::
:::tabs-item{label="Blob" icon="i-lucide-shapes"}
```ts
import { blob } from 'hub:blob'

// Ensure the blob is valid
ensureBlob(imageData, { maxSize: '1MB', types: ['image'] })

// Upload files with ease
const file = await blob.put('avatars/user-1.png', imageData, {
  access: 'public'
})

// List avatars
const avatars = await blob.list({ prefix: 'avatars/', limit: 10 })

// Serve the avatar with streaming
return blob.serve(event, 'avatars/atinux.png')
```
:::
:::tabs-item{label="KV" icon="i-lucide-list"}
```ts
import { kv } from 'hub:kv'

// Store and retrieve any data
await kv.set('user:1:session', { token, expiresAt })

const session = await kv.get('user:1:session')

// With TTL support
await kv.set('rate-limit:ip', count, { ttl: 60 })
```
:::
:::tabs-item{label="Cache" icon="i-lucide-zap"}
```ts
// Cache API responses for 1 hour
export default defineCachedEventHandler(async () => {
  const data = await $fetch('https://api.example.com')
  return data
}, { maxAge: 60 * 60 })

// Or cache any function
const getStats = defineCachedFunction(fetchStats, {
  maxAge: 60 * 5,
})
```
::
::

::u-container
  :::u-page-grid{class="pb-12 xl:pb-24"}
    :::landing-feature
    ---
    title: Multi-Platform
    description: Deploy your application with confidence to your favorite cloud provider.
    icon: i-lucide-cloud
    to: /docs/getting-started/deploy
    ---
    :::
    :::landing-feature
    ---
    title: SQL Database
    description: Query your database with a type-safe ORM and automated migrations.
    icon: i-lucide-database
    to: /docs/database
    ---
    :::
    :::landing-feature
    ---
    title: Files Storage
    description: Upload, store and serve images, videos and any kind of file.
    icon: i-lucide-shapes
    to: /docs/blob
    ---
    :::
    :::landing-feature
    ---
    title: KV Storage
    description: Leverage a Key-Value data store replicated globally for maximum performance.
    icon: i-lucide-list
    to: /docs/kv
    ---
    :::
    :::landing-feature
    ---
    title: Caching
    description: Cache Nuxt pages, API routes and server functions on the Edge.
    icon: i-lucide-zap
    to: /docs/cache
    ---
    :::
    :::landing-feature
    ---
    title: DevTools
    description: Access your application's data and storage in the Nuxt DevTools.
    icon: i-lucide-monitor
    to: /docs/getting-started#nuxt-devtools
    ---
    :::
  :::
::
