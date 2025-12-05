---
title: "Build full-stack Nuxt applications."
navigation: false
description: "Build full-stack Nuxt applications, with zero configuration. NuxtHub supercharges your Nuxt development workflow so you can focus on shipping features."
---

::u-page-hero
---
orientation: 'horizontal'
---
#headline
  <!-- :::u-button
  ---
  size: sm
  to: /blog/v1
  variant: outline
  trailing-icon: i-lucide-arrow-right
  ---
  NuxtHub v1
  ::: -->

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
::code-group
```ts [server/api/todos.ts]
import { db } from 'hub:db'
import { kv } from 'hub:kv'
import { blob } from 'hub:blob'

const todos = await db.query.todos.findMany()

const value = await kv.get('my-key')

const file = await blob.put('my-file.txt', 'file-content')

const cachedAPICall = defineCachedFunction(async () => {
  return $fetch('https://api.example.com/todos')
}, { maxAge: 60 * 60 })
```
```ts [server/db/schema.ts]
import { pgTable, integer, text, boolean } from 'drizzle-orm/pg-core'

export const todos = pgTable('todos', {
  id: integer().primaryKey(),
  title: text().notNull(),
  completed: boolean().notNull().default(false),
})
```
```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['@nuxthub/core'],
  hub: {
    blob: true,
    cache: true,
    db: 'postgresql',
    kv: true,
  }
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
    to: /docs/features/database
    ---
    :::
    :::landing-feature
    ---
    title: Files Storage
    description: Upload, store and serve images, videos and any kind of file.
    icon: i-lucide-shapes
    to: /docs/features/blob
    ---
    :::
    :::landing-feature
    ---
    title: KV Storage
    description: Leverage a Key-Value data store replicated globally for maximum performance.
    icon: i-lucide-list
    to: /docs/features/kv
    ---
    :::
    :::landing-feature
    ---
    title: Caching
    description: Cache Nuxt pages, API routes and server functions on the Edge.
    icon: i-lucide-zap
    to: /docs/features/cache
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

::landing-testimonial
---
quote: "I created NuxtHub to give Nuxt developers the ability to create full-stack applications, with the same DX as Nuxt and a progressive approach."
author:
  name: "Sébastien Chopin"
  description: "Creator of Nuxt & NuxtHub"
  to: "https://x.com/Atinux"
  avatar:
    src: "https://ipx.nuxt.com/f_auto,s_40x40/gh_avatar/atinux"
    srcset: "https://ipx.nuxt.com/f_auto,s_80x80/gh_avatar/atinux 2x"
---
::
