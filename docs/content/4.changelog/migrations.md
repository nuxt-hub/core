---
title: Database migrations
description: "Database migrations are now automatically applied during development and deployment."
date: 2024-10-25
image: '/images/changelog/migrations.png'
category: Core
authors:
  - name: Rihan Arfan
    avatar:
      src: https://avatars.githubusercontent.com/u/20425781?v=4
    to: https://x.com/RihanArfan
    username: RihanArfan
---

::tip
This feature is available on both [free and pro plans](/pricing) and in [`@nuxthub/core >= v0.0.0`](https://github.com/nuxt-hub/core/releases).
::

We are excited to introduce [database migrations](/docs/features/database#migrations) in NuxtHub. Database migration files in `server/database/migrations/*.sql` are now applied automatically when starting the development server, or when deploying a project.

:nuxt-img{src="/images/changelog/migrations.png" alt="NuxtHub migrations" width="915" height="515"}


## Usage

Read the [full documentation](/docs/features/database#migrations) to learn more about migrations.

### Create new migration

You can create a new blank database migration file by running this command.

```bash [Terminal]
npx nuxthub database migrations create <name>
```

Once the migration is created, you can add SQL queries to modify your database, such as to add a new table.

### List applied and pending migrations

You can view all applied and pending migrations for an environment using this command.

```bash [Terminal]
npx nuxthub database migrations list [--preview] [--production]
```

By default it will show you applied and pending migrations for the local environment.

### Apply migrations

Database migrations are automatically applied during:
- Deploying via [CLI](/docs/getting-started/deploy#nuxthub-cli) or [Cloudflare Pages CI](/docs/getting-started/deploy#cloudflare-pages-ci) for projects linked to NuxtHub
- Starting the development server `npm run dev [--remote]`
- Locally previewing a build with [nuxthub preview](/changelog/nuxthub-preview)

## Migration from existing ORM

::important
**If you are using Drizzle ORM** with a Nuxt plugin to automatically apply migrations, follow this migration path.
::

NuxtHub will attempt to rerun all migrations within `server/database/migrations/*.sql` since it is unaware they are already applied, as migrations previously applied with Drizzle ORM are stored within the `__drizzle_migrations` table.

Run the command `nuxthub database migrations mark-all-applied` on each environment to mark all existing migration files as applied.

```bash [Terminal]
nuxthub database migrations mark-all-applied --local|preview|production
```

By default it will mark all migrations as applied on the local environment.

::collapsible{name="self-hosting docs"}

If you are [self-hosting](/docs/getting-started/deploy#self-hosted) NuxtHub, set the `NUXT_HUB_PROJECT_SECRET_KEY` environment variable before running the command. <br><br>

```bash [Terminal]
NUXT_HUB_PROJECT_SECRET_KEY=<secret> nuxthub database migrations mark-all-applied --local|preview|production
```

::

## What are database migrations?

Database migrations are a system for managing incremental, version-controlled changes to database schemas that tracks modifications and ensures consistent database evolution across all environments.

::note
This feature has been implemented in [nuxt-hub/core#333](https://github.com/nuxt-hub/core/pull/333).
::
