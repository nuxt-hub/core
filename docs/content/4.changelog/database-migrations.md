---
title: Automatic Database Migrations
description: "Database migrations now automatically apply during development and deployment."
date: 2024-10-25
image: '/images/changelog/database-migrations.png'
category: Core
authors:
  - name: Rihan Arfan
    avatar:
      src: https://avatars.githubusercontent.com/u/20425781?v=4
    to: https://x.com/RihanArfan
    username: RihanArfan
  - name: Sebastien Chopin
    avatar: 
      src: https://avatars.githubusercontent.com/u/904724?v=4
    to: https://x.com/atinux
    username: atinux
---

::tip
This feature is available on both [free and pro plans](/pricing) and in [`@nuxthub/core >= v0.8.0`](https://github.com/nuxt-hub/core/releases).
::

We're excited to introduce automatic [database migrations](/docs/features/database#migrations) in NuxtHub.

### Automatic Migration Application

SQL migrations in `server/database/migrations/*.sql` now automatically apply when you:
- Start the development server (`npx nuxt dev` or [`npx nuxt dev --remote`](/docs/getting-started/remote-storage))
- Preview builds locally ([`npx nuxthub preview`](/changelog/nuxthub-preview))
- Deploy via [`npx nuxthub deploy`](/docs/getting-started/deploy#nuxthub-cli) or [Cloudflare Pages CI](/docs/getting-started/deploy#cloudflare-pages-ci)

Starting now, when you clone any of [our templates](/templates) with a database, all migrations apply automatically!

::note{to="/docs/features/database#migrations"}
Learn more about database migrations in our **full documentation**.
::

## New CLI Commands

[`nuxthub@0.7.0`](https://github.com/nuxt-hub/cli) introduces these database migration commands:

```bash [Terminal]
# Create a new migration
npx nuxthub database migrations create <name>

# View migration status
npx nuxthub database migrations list

# Mark all migrations as applied
npx nuxthub database migrations mark-all-applied
```

Learn more about:
- [Creating migrations](/docs/features/database##creating-migrations)
- [Checking migration status](/docs/features/database#checking-migration-status)
- [Marking migrations as applied](/docs/features/database#marking-migrations-as-applied)

## Migrating from Existing ORMs

::important
**Current Drizzle ORM users:** Follow these specific migration steps.
::

Since NuxtHub doesn't recognize previously applied Drizzle ORM migrations (stored in `__drizzle_migrations`), it will attempt to rerun all migrations in `server/database/migrations/*.sql`. To prevent this:

1. Mark existing migrations as applied in each environment:

    ```bash [Terminal]
    # Local environment
    npx nuxthub database migrations mark-all-applied

    # Preview environment
    npx nuxthub database migrations mark-all-applied --preview

    # Production environment
    npx nuxthub database migrations mark-all-applied --production
    ```

2. Remove `server/plugins/database.ts` as it's no longer needed.

## Understanding Database Migrations

Database migrations provide version control for your database schema. They track changes and ensure consistent schema evolution across all environments through incremental updates.

::note
Implemented in [nuxt-hub/core#333](https://github.com/nuxt-hub/core/pull/333) and [nuxt-hub/cli#31](https://github.com/nuxt-hub/cli/pull/31).
::
