---
title: NuxtHub Multi-Vendor is now available
description: "NuxtHub is now available on multiple cloud providers. You can now deploy your NuxtHub project on your own hosting provider."
date: 2025-12-10
image: '/images/changelog/nuxthub-multi-vendor.png'
authors:
  - name: Sebastien Chopin
    avatar:
      src: https://avatars.githubusercontent.com/u/904724?v=4
    to: https://x.com/atinux
    username: atinux
  - name: Rihan Arfan
    avatar:
      src: https://avatars.githubusercontent.com/u/20425781?v=4
    to: https://bsky.app/profile/rihan.dev
    username: rihan.dev
---

::tip
This feature is available in [`@nuxthub/core >= v0.10.0`](https://github.com/nuxt-hub/core/releases/tag/v0.10.0).
::

Since [Vercel's acquisition of NuxtLabs](https://nuxtlabs.com), we've been working to let you build full-stack Nuxt applications across multiple hosting providers. Today, we're excited to announce that **NuxtHub is now multi-vendor**.

## Deploy Anywhere

With **v0.10**, you can now deploy your NuxtHub projects to any hosting provider while keeping an almost zero-config experience. Whether you choose Cloudflare, Vercel, AWS, or any other provider, NuxtHub now adapts to your infrastructure.

### What's Supported

NuxtHub v0.10 brings multi-cloud support for all core features:

- **Database**: Use SQLite, PostgreSQL, or MySQL with [Drizzle ORM](/docs/features/database) — NuxtHub auto-configures based on your provider
- **Blob Storage**: Upload and serve files from [Cloudflare R2](https://developers.cloudflare.com/r2/), [Vercel Blob](https://vercel.com/docs/storage/vercel-blob), [AWS S3](https://aws.amazon.com/s3/), and more
- **KV Storage**: Key-value storage via [Cloudflare KV](https://developers.cloudflare.com/kv), [Upstash Redis](https://upstash.com/docs/redis), [Vercel KV](https://vercel.com/docs/storage/vercel-kv), and others
- **Cache Storage**: Efficient caching that works across all supported providers

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    db: 'postgresql',  // or 'sqlite', 'mysql'
    blob: true,
    kv: true,
    cache: true
  }
})
```

NuxtHub detects your deployment environment and configures the appropriate drivers automatically. It also uses PGLite locally if no PostgreSQL connection is provided.

::note{to="/docs/getting-started/migration"}
Read the migration guide to upgrade your existing project to v0.10.
::

## First-Class Drizzle Support

NuxtHub v0.10 introduces a completely new database experience powered by [Drizzle ORM](https://orm.drizzle.team). This isn't just a wrapper, it's a deep integration that makes working with a database in Nuxt as easy as using a `db` instance.

### Auto-Registered Schema

Define your schema in `server/db/schema.ts` (or split across multiple files in `server/db/schema/`), and NuxtHub automatically registers everything:

```ts [server/db/schema.ts]
import { pgTable, text, serial, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  createdAt: timestamp().notNull().defaultNow()
})
```

Your schema is then accessible via the `schema` object in the `hub:db` namespace:

```ts [server/api/users.get.ts]
import { db, schema } from 'hub:db'

export default eventHandler(async () => {
  return await db.select().from(schema.users)
})
```

### Extendable by Modules & Layers

One of the most powerful features is the ability for [Nuxt modules](https://nuxt.com/modules) and [layers](https://nuxt.com/docs/getting-started/layers) to extend your database schema. This opens up exciting possibilities for the ecosystem, an auth module could automatically add user tables, or a CMS module that brings its own content schemas.

```ts [modules/auth/index.ts]
export default defineNuxtModule({
  setup(options, nuxt) {
    nuxt.hook('hub:db:schema:extend', async ({ dialect, paths }) => {
      paths.push(await resolvePath(`./schema/users.${dialect}`))
    })
  }
})
```

### The `nuxt db` CLI

Managing your database is now as simple as running a few commands:

```bash [Terminal]
# Generate migrations from schema changes
npx nuxt db generate

# Apply migrations
npx nuxt db migrate

# Run SQL queries directly
npx nuxt db sql "SELECT * FROM users"

# Mark migrations as applied
npx nuxt db mark-as-migrated <name>

# Drop a table
npx nuxt db drop <table>
```

Migrations are automatically applied during development and at build time — no extra configuration needed.

::note{to="/docs/features/database"}
Read the full Database documentation to learn more.
::

::important
We are in the process of building `@nuxt/db` based on the work of NuxtHub DB v0.10.
::

## Templates Update

We are in the process of updating all our templates to support the new multi-vendor architecture. Stay tuned for updated starters that work out of the box with Vercel, Cloudflare, and more.

## NuxtHub Admin Transition

As we move toward a fully self-hosted, multi-cloud future, we're making important changes to NuxtHub Admin.

### Migration Tool

We've added a **guided migration tool** directly in [NuxtHub Admin](https://admin.hub.nuxt.com). This tool helps you:

- **Stay on Cloudflare**: Keep your project on Cloudflare with current bindings using `wrangler.jsonc`
- **Move to Vercel**: Migrate your project and optionally migrate the database, KV, and blob storage to Vercel

The migration tool walks you through each step, ensuring your data and configuration are preserved.

### Subscription Changes

**During December 2025**, we will cancel all active subscriptions. Pro-rata refunds will be issued for any unused time beyond **December 31st, 2025**.

During this period:
- You **won't be able** to create new projects on NuxtHub Admin
- You **will still be able** until February 2nd, 2026 to:
  - deploy existing projects
  - manage your projects on the dashboard

### CLI & Action Deprecation

Starting **February 2nd, 2026**, new deployments using the `nuxthub` CLI and GitHub Action will no longer work. We recommend switching to your provider's native deployment method:

- **Cloudflare**: Use [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
- **Vercel**: Use the [Vercel CLI](https://vercel.com/docs/cli) or [Git integration](https://vercel.com/docs/deployments/git)
- **Other providers**: Use their respective CLI or CI/CD pipelines

::callout
You can visit [legacy.hub.nuxt.com](https://legacy.hub.nuxt.com) to access the legacy documentation for **v0.9**.
::

## Looking Forward

This release represents a major step in NuxtHub's evolution. With v0.10, NuxtHub works wherever you deploy. Pick the cloud that makes sense for your project without sacrificing the developer experience that makes NuxtHub special.

Thank you for being part of this journey. We can't wait to see what you build with NuxtHub v0.10.
