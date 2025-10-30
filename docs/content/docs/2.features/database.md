---
title: SQL Database
navigation.title: Database
seo.title: Nuxt SQL Database
description: Access a SQL database with Drizzle ORM in Nuxt to store and retrieve relational data with full type-safety.
---

NuxtHub Database provides a type-safe SQL database powered by [Drizzle ORM](https://orm.drizzle.team), supporting PostgreSQL, MySQL, and SQLite with smart detection and automatic migrations at build time.

## Getting started

::steps{level="3"}
### Install dependencies

Install Drizzle ORM, Drizzle Kit, and the appropriate driver(s) for the database you are using:

::tabs{sync="database-dialect"}
  :::tabs-item{label="PostgreSQL" icon="i-simple-icons-postgresql"}
    :pm-install{name="drizzle-orm drizzle-kit pg @electric-sql/pglite"}
    ::callout
    NuxtHub automatically detects your database connection using environment variables:
    - Uses `PGlite` (embedded PostgreSQL) if no environment variables are set.
    - Uses `node-postgres` driver if you set `DATABASE_URL`, `POSTGRES_URL`, or `POSTGRESQL_URL` environment variable.
    ::
  :::
  :::tabs-item{label="MySQL" icon="i-simple-icons-mysql"}
    :pm-install{name="drizzle-orm drizzle-kit mysql2"}
    ::callout
    NuxtHub automatically detects your database connection using environment variables:
    - Uses `mysql2` driver if you set `DATABASE_URL` or `MYSQL_URL` environment variable.
    - Requires environment variable (no local fallback)
    ::
  :::
  :::tabs-item{label="SQLite" icon="i-simple-icons-sqlite"}
    :pm-install{name="drizzle-orm drizzle-kit @libsql/client"}
    ::callout
    NuxtHub automatically detects your database connection using environment variables:
    - Uses `libsql` driver for [Turso](https://turso.tech) if you set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` environment variables.
    - Uses `libsql` locally with file at `.data/database/sqlite.db` if no environment variables are set.
    ::
  :::
::

### Set SQL dialect

Enable the database in your `nuxt.config.ts` by setting the `database` property to your desired SQL dialect:

::tabs{sync="database-dialect"}
  :::tabs-item{label="PostgreSQL" icon="i-simple-icons-postgresql"}
  ```ts [nuxt.config.ts]
  export default defineNuxtConfig({
    hub: {
      database: 'postgresql'
    }
  })
  ```
  :::
  :::tabs-item{label="MySQL" icon="i-simple-icons-mysql"}
  ```ts [nuxt.config.ts]
  export default defineNuxtConfig({
    hub: {
      database: 'mysql'
    }
  })
  ```
  :::
  :::tabs-item{label="SQLite" icon="i-simple-icons-sqlite"}
  ```ts [nuxt.config.ts]
  export default defineNuxtConfig({
    hub: {
      database: 'sqlite'
    }
  })
  ```
  :::
::

### Database schema

Create your database schema with full TypeScript support using Drizzle ORM:

::tabs{sync="database-dialect"}
  :::tabs-item{label="PostgreSQL" icon="i-simple-icons-postgresql"}
    ```ts [server/database/schema.ts]
    import { pgTable, text, serial, timestamp } from 'drizzle-orm/pg-core'

    export const users = pgTable('users', {
      id: serial().primaryKey(),
      name: text().notNull(),
      email: text().notNull().unique(),
      password: text().notNull(),
      avatar: text().notNull(),
      createdAt: timestamp().notNull().defaultNow(),
    })
    ```
  :::

  :::tabs-item{label="MySQL" icon="i-simple-icons-mysql"}
    ```ts [server/database/schema.ts]
    import { mysqlTable, text, serial, timestamp } from 'drizzle-orm/mysql-core'

    export const users = mysqlTable('users', {
      id: serial().primaryKey(),
      name: text().notNull(),
      email: text().notNull().unique(),
      password: text().notNull(),
      avatar: text().notNull(),
      createdAt: timestamp().notNull().defaultNow(),
    })
    ```
  :::

  :::tabs-item{label="SQLite" icon="i-simple-icons-sqlite"}
    ```ts [server/database/schema.ts]
    import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

    export const users = sqliteTable('users', {
      id: integer().primaryKey({ autoIncrement: true }),
      name: text().notNull(),
      email: text().notNull().unique(),
      password: text().notNull(),
      avatar: text().notNull(),
      createdAt: integer({ mode: 'timestamp' }).notNull(),
    })
    ```
  :::
::

::callout
Database schema can be defined in a single file or in multiple files, these files are scanned and automatically imported for each [Nuxt layer](https://nuxt.com/docs/getting-started/layers):
- `server/database/schema.ts`
- `server/database/schema/*.ts`

NuxtHub support filtering files by dialect by using the `.{dialect}.ts` suffix, e.g. `server/database/schema.postgresql.ts` will be only imported if `hub.database` is `postgresql`.
::

The merged schema is exported in `hub:database:schema` or via the `schema` object in the `hub:database` namespace:

```ts
import * as schema from 'hub:database:schema'
// or
import { schema } from 'hub:database'
```

::note
If you are a Nuxt module developer, you can also extend the database schema by using the `hub:database:schema:extend` hook:

```ts [modules/cms/index.ts]
import { defineNuxtModule, createResolver } from 'nuxt/kit'

export default defineNuxtModule({
  setup(options, nuxt) {
    const { resolvePath } = createResolver(import.meta.url)
    nuxt.hook('hub:database:schema:extend', async ({ dialect, paths }) => {
      // Add your module drizzle schema files for the given dialect
      // e.g. ./schema/pages.postgresql.ts if hub.database is 'postgresql'
      paths.push(await resolvePath(`./schema/pages.${dialect}`))
    })
  }
})
```
::

::callout{to="https://orm.drizzle.team/docs/sql-schema-declaration" external}
Learn more about [Drizzle ORM schema](https://orm.drizzle.team/docs/sql-schema-declaration) on the Drizzle documentation.
::

### Generate migrations

Generate the database migrations from your schema:

```bash [Terminal]
npx nuxthub database generate
```

This creates SQL migration files in `server/database/migrations/` which are automatically applied during deployment and development.

::tip{icon="i-lucide-rocket"}
That's it! You can now start your development server and query your database using the `db` instance from `hub:database`.
::

::important
Make sure to run `npx nuxthub database generate` to generate the database migrations each time you change your database schema and restart the development server.
::

::


## Query database

Now that you have your database schema and migrations set up, you can start querying your database.

### SQL Select

```ts [server/api/users.get.ts]
import { db, schema } from 'hub:database'

export default eventHandler(async (event) => {
  return await db.query.users.findMany()
  // or
  return await db.select().from(schema.users)
})
```

::callout{to="https://orm.drizzle.team/docs/select" external}
Learn more about [Drizzle ORM select](https://orm.drizzle.team/docs/select) on the Drizzle documentation.
::

### SQL Insert

```ts [server/api/users.post.ts]
import { db, schema } from 'hub:database'

export default eventHandler(async (event) => {
  const { name, email } = await readBody(event)

  return await db
    .insert(schema.users)
    .values({
      name,
      email,
      createdAt: new Date()
    })
    .returning()
})
```

::callout{to="https://orm.drizzle.team/docs/insert" external}
Learn more about [Drizzle ORM insert](https://orm.drizzle.team/docs/insert) on the Drizzle documentation.
::

### SQL Update

```ts [server/api/users/[id\\].patch.ts]
import { db, schema } from 'hub:database'

export default eventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const { name } = await readBody(event)

  return await db
    .update(schema.users)
    .set({ name })
    .where(eq(tables.users.id, Number(id)))
    .returning()
})
```

::callout{to="https://orm.drizzle.team/docs/update" external}
Learn more about [Drizzle ORM update](https://orm.drizzle.team/docs/update) on the Drizzle documentation.
::

### SQL Delete

```ts [server/api/users/[id\\].delete.ts]
import { db, schema } from 'hub:database'

export default eventHandler(async (event) => {
  const { id } = getRouterParams(event)
    
  const deletedUser = await db
    .delete(schema.users)
    .where(eq(schema.users.id, Number(id)))
    .returning()

  if (!deletedUser) {
    throw createError({
      statusCode: 404,
      message: 'User not found'
    })
  }

  return { deleted: true }
})
```

::callout{to="https://orm.drizzle.team/docs/delete" external}
Learn more about [Drizzle ORM delete](https://orm.drizzle.team/docs/delete) on the Drizzle documentation.
::

## Database migrations

Database migrations provide version control for your database schema. NuxtHub supports SQL migration files (`.sql`) and automatically applies them during development and deployment. Making them fully compatible with Drizzle Kit generated migrations.

::note
Create dialect-specific migrations with `.<dialect>.sql` suffix (e.g., `0001_create-todos.postgresql.sql`).
::

### Migrations Directories

NuxtHub scans `server/database/migrations` for migrations in each [Nuxt layer](https://nuxt.com/docs/getting-started/layers).

To scan additional directories, specify them in your config:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    database: {
      dialect: 'postgresql',
      migrationsDirs: [
        'server/database/custom-migrations/'
      ]
    }
  }
})
```

For more control (e.g., in Nuxt modules), use the `hub:database:migrations:dirs` hook:

::code-group
```ts [modules/auth/index.ts]
import { createResolver, defineNuxtModule } from 'nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'my-auth-module'
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    nuxt.hook('hub:database:migrations:dirs', (dirs) => {
      dirs.push(resolve('./db-migrations'))
    })
  }
})
```
```sql [modules/auth/db-migrations/0001_create-users.sql]
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL
);
```
::

::tip
All migration files are copied to `.data/database/migrations` when you run Nuxt, giving you a consolidated view.
::

### Automatic Application

Migrations are automatically applied when you:
- Start the development server (`npx nuxi dev`)
- Build the application (`npx nuxi build`)

Applied migrations are tracked in the `_hub_migrations` database table.

### Creating Migrations

If you want to create migrations manually without using Drizzle Kit, you can use the following command:

```bash [Terminal]
npx nuxt hub database migrations create <name>
```

::important
Migration names must only contain alphanumeric characters and `-` (spaces are converted to `-`).
::

Example:

```bash [Example]
> npx nuxthub database migrations create create-todos
✔ Created ./server/database/migrations/0001_create-todos.sql
```

Then add your SQL query to the migration file:

```sql [0001_create-todos.sql]
-- Migration number: 0001 	 2025-01-30T17:17:37.252Z

CREATE TABLE `todos` (
  `id` integer PRIMARY KEY NOT NULL,
  `user_id` integer NOT NULL,
  `title` text NOT NULL,
  `completed` integer DEFAULT 0 NOT NULL,
  `created_at` integer NOT NULL
);
```

### Post-Migration Queries

::important
Advanced use case: These queries run after migrations but aren't tracked in `_hub_migrations`. Ensure they're idempotent.
::

Use the `hub:database:queries:paths` hook to run additional queries after migrations:

::code-group
```ts [modules/admin/index.ts]
import { createResolver, defineNuxtModule } from 'nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'my-auth-module'
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    nuxt.hook('hub:database:queries:paths', (paths) => {
      paths.push(resolve('./db-queries/seed-admin.sql'))
    })
  }
})
```
```sql [modules/admin/db-queries/seed-admin.sql]
INSERT OR IGNORE INTO admin_users (id, email, password) VALUES (1, 'admin@nuxt.com', 'admin');
```
::

::tip
All migrations queries are copied to `.data/database/queries` when you run Nuxt, giving you a consolidated view.
::

### Foreign Key Constraints

For Cloudflare D1 with Drizzle ORM migrations, replace:

```diff [Example]
-PRAGMA foreign_keys = OFF;
+PRAGMA defer_foreign_keys = on;

ALTER TABLE ...

-PRAGMA foreign_keys = ON;
+PRAGMA defer_foreign_keys = off;
```

::callout{to="https://developers.cloudflare.com/d1/sql-api/foreign-keys/#defer-foreign-key-constraints" external}
Learn more about [defer foreign key constraints](https://developers.cloudflare.com/d1/sql-api/foreign-keys/#defer-foreign-key-constraints) in Cloudflare D1.
::

## Database seed

You can populate your database with initial data using [Nitro Tasks](https://nitro.build/guide/tasks):

::steps{level="3"}

### Enable Nitro tasks

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  nitro: {
    experimental: {
      tasks: true
    }
  }
})
```

### Create a seed task

```ts [server/tasks/seed.ts]
export default defineTask({
  meta: {
    name: 'db:seed',
    description: 'Seed database with initial data'
  },
  async run() {
    console.log('Seeding database...')
    
    const users = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashed_password',
        avatar: 'https://i.pravatar.cc/150?img=1',
        createdAt: new Date()
      },
      {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'hashed_password',
        avatar: 'https://i.pravatar.cc/150?img=2',
        createdAt: new Date()
      }
    ]
    
    await useDrizzle().insert(tables.users).values(users)
    
    return { result: 'Database seeded successfully' }
  }
})
```

### Execute the task

Open the `Tasks` tab in Nuxt DevTools and click on the `db:seed` task.

::

## Local development

During local development, view and edit your database from [Nuxt DevTools](https://devtools.nuxt.com) using the [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview):

:img{src="/images/landing/nuxt-devtools-database.png" alt="Nuxt DevTools Database" width="915" height="515"}

::warning
At the moment, Drizzle Studio does not support PGlite.
::

## Advanced configuration

For advanced use cases, you can explicitly configure the database connection:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    database: {
      dialect: 'postgresql',
      driver: 'node-postgres', // Optional: explicitly choose driver
      connection: {
        connectionString: process.env.DATABASE_URL
      }
    }
  }
})
```

## Migration guide

::important
**Breaking changes in NuxtHub v1:** If you're upgrading from a previous version that used `hubDatabase()`, follow this migration guide.
::

### Configuration changes

The `database` option now accepts a SQL dialect instead of a boolean to enable it.

```diff [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
-    database: true
+    database: 'sqlite'
  }
})
```

Valid dialects are `sqlite`, `postgresql` and `mysql`.

### API changes

The old `hubDatabase()` function has been removed. You must now use Drizzle ORM.

**Before:**

```ts
const db = hubDatabase()
const result = await db.prepare('SELECT * FROM users').all()
```

**After:**
```ts
const db = useDrizzle()
const result = await db.select().from(tables.users)
```

### Migration files

Your existing SQL migration files continue to work! No changes needed.
