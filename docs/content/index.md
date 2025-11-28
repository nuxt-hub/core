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

// Access SQL database
const todos = await db.query.todos.findMany()
// Access Key-Value storage
const value = await kv.get('my-key')
// Upload a file to the blob storage
const file = await blob.put('my-file.txt', 'file-content')
// Cache a function
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
<!-- 
fullStack:
  title: Your [full-stack]{.text-primary} companion.
  description: On top of hosting your Nuxt projects, you can add a database, key-value and file storage with nearly-zero configuration, locally and globally. <br> Making it too easy to build & ship full-stack Nuxt applications.
sections:
  - title: A Relational Database
    description: >
      Add a SQL database by setting your favorite dialect, NuxtHub will autoomatically configure the database client for you.
    image:
      dark: "/images/landing/nuxthub-admin-database-dark.svg"
      light: "/images/landing/nuxthub-admin-database-light.svg"
      width: 581
      height: 293
    headline:
      title: Database
      icon: i-lucide-database
    features:
      - title: "Type-safe with Drizzle ORM"
        icon: i-lucide-square-function
      - title: "Support for SQLite, PostgreSQL & MySQL"
        icon: i-lucide-table
      - title: "Automatic database migrations"
        icon: i-lucide-circle-check
    links:
      - label: Learn more
        trailing-icon: i-lucide-arrow-right
        color: neutral
        variant: subtle
        size: sm
        to: /docs/features/database
  - title: Add & Manage File Uploads
    description: 'NuxtHub Blob lets you store and access media files on multiple storages. Allow users to securely upload data-like images, videos and audio files with our server helpers.'
    image:
      dark: "/images/landing/nuxthub-admin-blob-dark.svg"
      light: "/images/landing/nuxthub-admin-blob-light.svg"
      width: 581
      height: 317
    headline:
      title: Blob
      icon: i-lucide-shapes
    features:
      - title: "hubBlob() server helper"
        icon: i-lucide-square-function
      - title: "Support multi-part uploads"
        icon: i-lucide-align-horizontal-justify-end
      - title: "Manage blobs in the Nuxt DevTools (soon)"
        icon: i-simple-icons-nuxtdotjs
    links:
      - label: Learn more
        trailing-icon: i-lucide-arrow-right
        color: neutral
        variant: subtle
        size: sm
        to: /docs/features/blob
  - title: A Key-Value Database
    description: >
      Store unstructured data with NuxtHub key-value storage, compatible with many providers.
    image:
      dark: "/images/landing/nuxthub-admin-kv-dark.svg"
      light: "/images/landing/nuxthub-admin-kv-light.svg"
      width: 582
      height: 310
    headline:
      title: Key-Value
      icon: i-lucide-list
    features:
      - title: "import { kv } from 'hub:kv'"
        icon: i-lucide-square-function
      - title: "Auto configure the provider based on environment"
        icon: i-lucide-sliders-vertical
      - title: "Manage KV storage in the Nuxt DevTools (soon)"
        icon: i-simple-icons-nuxtdotjs
    links:
      - label: Learn more
        trailing-icon: i-lucide-arrow-right
        color: neutral
        variant: subtle
        size: sm
        to: /docs/features/kv
  - title: Optimize your Nuxt app performance
    description: "NuxtHub's Cache feature provides powerful tools to optimize your application's performance by caching pages, API routes, and server functions. This can significantly reduce load times and improve user experience."
    image:
      dark: "/images/landing/nuxthub-admin-cache-dark.svg"
      light: "/images/landing/nuxthub-admin-cache-light.svg"
      width: 581
      height: 310
    headline:
      title: Caching
      icon: i-lucide-database-zap
    features:
      - title: "API Routes Caching"
        icon: i-lucide-signpost
      - title: "Server Functions Caching"
        icon: i-lucide-square-function
      - title: "Cache storage browser management (soon)"
        icon: i-lucide-panel-left
    links:
      - label: Learn more
        trailing-icon: i-lucide-arrow-right
        color: neutral
        variant: subtle
        size: sm
        to: /docs/features/cache -->
