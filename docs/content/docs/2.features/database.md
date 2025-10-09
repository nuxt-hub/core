---
title: SQL Database
navigation.title: Database
description: Access a SQL database in Nuxt to store and retrieve relational data.
---

NuxtHub Database supports PostgreSQL, MySQL and SQLite, and automatically configures [Nitro Database](https://nitro.build/guide/database), which is built on [db0](https://db0.unjs.io/).

## Getting Started

Enable the database in NuxtHub by setting the `database` property to your dialect in `hub` within your `nuxt.config.ts` file.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    database: 'postgresql' // or 'mysql' or 'sqlite'
  }
})
```

::tip
Checkout our [Drizzle ORM recipe](/docs/guides/drizzle) to get started with the database by providing a schema and migrations.
::

### Automatic Configuration

When building the Nuxt app, NuxtHub automatically configures database connectors on many providers.

::tabs
  :::div{label="Vercel" icon="i-simple-icons-vercel"}

    When deploying to Vercel, Nitro Database `db` is configured for [PostgreSQL](https://www.postgresql.org/).

    ::tabs
      ::::div{label="PostgreSQL" icon="i-simple-icons-postgresql"}

        1. Install the `pg` package

        :pm-install{name="pg"}

        2. Add a PostgreSQL database to your project from the [Vercel dashboard](https://vercel.com/) -> Project -> Storage

      ::::
    ::

  :::

  :::div{label="Cloudflare" icon="i-simple-icons-cloudflare"}

    When deploying to Cloudflare, Nitro Database `db` is configured based on your database dialect.

    ::tabs
      ::::div{label="SQLite" icon="i-simple-icons-sqlite"}

        When using SQLite, the database is configured for [Cloudflare D1](https://developers.cloudflare.com/d1/).

        Add a `DB` binding to a [Cloudflare D1](https://developers.cloudflare.com/d1/) database in your `wrangler.jsonc` config.

        ```json [wrangler.jsonc]
        {
          "$schema": "node_modules/wrangler/config-schema.json",
          // ...
          "d1_databases": [
            {
              "binding": "DB",
              "database_name": "<database_name>",
              "database_id": "<database_id>"
            }
          ]
        }
        ```

        Learn more about adding bindings on [Cloudflare's documentation](https://developers.cloudflare.com/d1/get-started/#3-bind-your-worker-to-your-d1-database).

      ::::

      ::::div{label="PostgreSQL" icon="i-simple-icons-postgresql"}

        1. Install the `pg` package

        :pm-install{name="pg"}

        ::note
        Zero-config PostgreSQL via Hyperdrive support is not yet implemented for Cloudflare presets.
        ::

      ::::

      ::::div{label="MySQL" icon="i-simple-icons-mysql"}

        1. Install the `mysql2` package

        :pm-install{name="mysql2"}

        ::note
        Zero-config MySQL via Hyperdrive support is not yet implemented for Cloudflare presets.
        ::

      ::::
    ::

  :::

  :::div{label="Other" icon="i-simple-icons-nodedotjs"}

    When deploying to other providers, Nitro Database `db` is configured based on your database dialect.

    ::tabs
      ::::div{label="PostgreSQL" icon="i-simple-icons-postgresql"}

        1. Install the `pg` package

        :pm-install{name="pg"}

        2. Set one of the following environment variables to configure your database connection:
        - `POSTGRES_URL`
        - `POSTGRESQL_URL`
        - `DATABASE_URL`

      ::::

      ::::div{label="MySQL" icon="i-simple-icons-mysql"}

        1. Install the `mysql2` package

        :pm-install{name="mysql2"}

        ::note
        MySQL connector requires manual configuration in `nitro.database.db` within `nuxt.config.ts`.
        ::

      ::::

      ::::div{label="SQLite" icon="i-simple-icons-sqlite"}

        1. Install the `better-sqlite3` package

        :pm-install{name="better-sqlite3"}

        The database file will be stored at `.data/database/sqlite/db.sqlite3`.

      ::::
    ::

    ::tip{to="#manual-configuration"}
      You can manually configure the `db` within your Nitro Database configuration to use a different database connector.
    ::

  :::
::

### Manual Configuration

You can use any [db0](https://db0.unjs.io/connectors) connector by manually configuring the `db` within your [Nitro Database](https://nitro.build/guide/database) configuration.

::note
Manually configuring the `db` in Nitro Database overrides automatic configuration.
::

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  nitro: {
    database: {
      db: {
        connector: 'postgresql',
        options: {
          url: 'postgresql://username:password@host:port/database'
          /* any additional connector options */
        }
      }
    }
  },

  hub: {
    database: true,
  },
})
```

::callout{to="https://db0.unjs.io/connectors"}
You can find the connector list on [db0 documentation](https://db0.unjs.io/connectors) with their configuration.
::

### Local Development

During local development, NuxtHub automatically configures the database connector based on your configured dialect (from `hub.database` or inferred from your production `nitro.database.db` connector):

::tabs
  ::::div{label="SQLite" icon="i-simple-icons-sqlite"}

    Uses `better-sqlite3` connector with the database file stored at `.data/database/sqlite/db.sqlite3`.

  ::::

  ::::div{label="PostgreSQL" icon="i-simple-icons-postgresql"}

    **With environment variables set:**
    - Uses `postgresql` connector if `POSTGRES_URL`, `POSTGRESQL_URL`, or `DATABASE_URL` environment variables are provided

    **Without environment variables:**
    - Uses `pglite` connector (embedded PostgreSQL) with data stored at `.data/database/pglite/`

  ::::

  ::::div{label="MySQL" icon="i-simple-icons-mysql"}

    Requires manual configuration in `nitro.devDatabase.db` within your `nuxt.config.ts`.

    ```ts [nuxt.config.ts]
    export default defineNuxtConfig({
      nitro: {
        devDatabase: {
          db: {
            connector: 'mysql2',
            options: {
              host: 'localhost',
              port: 3306,
              user: 'root',
              password: 'password',
              database: 'mydb'
            }
          }
        }
      },
      hub: {
        database: 'mysql'
      }
    })
    ```

    ::note
    Zero-config MySQL database setup during local development is not supported yet.
    ::

  ::::
::

You can override the automatic local development configuration by manually specifying a different database connector:

::collapsible{name="manual local development database connector example"}
```ts [nuxt.config.ts]
export default defineNuxtConfig({
  nitro: {
    devDatabase: {
      db: {
        connector: 'postgresql',
        options: {
          url: 'postgresql://username:password@localhost:5432/mydb'
        }
      }
    }
  },
})
```
::

During local development, you can view and edit your database from Nuxt DevTools.

:img{src="/images/landing/nuxt-devtools-database.png" alt="Nuxt DevTools Database" width="915" height="515"}

## `useDatabase()`

Server composable that returns a [db0](https://db0.unjs.io/) instance.

NuxtHub automatically configures Nitro Database.

Learn more about `useDatabase()` on the [Nitro documentation](https://nitro.build/guide/database#usage).

```ts
const db = useDatabase('db')
```

::tip
Ensure that `'db'` is specified when using `useDatabase()` directly
::

## `hubDatabase()`

Server composable that returns a [Cloudflare D1](https://developers.cloudflare.com/d1/worker-api/d1-database/#methods) compatible database instance.

```ts
const db = hubDatabase()
```

::important
We recommend new users to use [`useDatabase('db')`](#usedatabase) instead of `hubDatabase()` as `hubDatabase()` is deprecated and may be removed in the future.
::

### `prepare()`

Generates a prepared statement to be used later.

```ts
const stmt = db.prepare('SELECT * FROM users WHERE name = "Evan You"')
```

::callout
Best practice is to use prepared statements which are precompiled objects used by the database to run the SQL. This is because prepared statements lead to overall faster execution and prevent SQL injection attacks.
::

### `bind()`

Binds parameters to a prepared statement, allowing you to pass dynamic values to the query.

```ts
const stmt = db.prepare('SELECT * FROM users WHERE name = ?1')

stmt.bind('Evan You')

// SELECT * FROM users WHERE name = 'Evan You'
```

The `?` character followed by a number (1-999) represents an ordered parameter. The number represents the position of the parameter when calling `.bind(...params)`.

```ts
const stmt = db
  .prepare('SELECT * FROM users WHERE name = ?2 AND age = ?1')
  .bind(3, 'Leo Chopin')
// SELECT * FROM users WHERE name = 'Leo Chopin' AND age = 3
```

If you instead use anonymous parameters (without a number), the values passed to `bind` will be assigned in order to the `?` placeholders in the query.

It's recommended to use ordered parameters to improve maintainable and ensure that removing or reordering parameters will not break your queries.

```ts
const stmt = db
  .prepare('SELECT * FROM users WHERE name = ? AND age = ?')
  .bind('Leo Chopin', 3)

// SELECT * FROM users WHERE name = 'Leo Chopin' AND age = 3
```

### `all()`

Returns all rows as an array of objects, with each result row represented as an object on the results property (see [Return Object](#return-object)).

```ts
const { results } = db.prepare('SELECT name, year FROM frameworks LIMIT 2').all()

console.log(results)
/*
[
  {
     name: "Laravel",
     year: 2011,
  },
   {
     name: "Nuxt",
     year: 2016,
  }
 ]
*/
```

The method return an object that contains the results (if applicable), the success status and a meta object:

```ts
{
  results: array | null, // [] if empty, or null if it does not apply
  success: boolean, // true if the operation was successful, false otherwise
  meta: {
    duration: number, // duration of the operation in milliseconds
    rows_read: number, // the number of rows read (scanned) by this query
    rows_written: number // the number of rows written by this query
  }
}
```

### `first()`

Returns the first row of the results. This does not return metadata like the other methods. Instead, it returns the object directly.

```ts
const framework = db.prepare('SELECT * FROM frameworks WHERE year = ?1').bind(2016).first()

console.log(framework)
/*
{
  name: "Nuxt",
  year: 2016,
}
*/
```

Get a specific column from the first row by passing the column name as a parameter:

```ts
const total = db.prepare('SELECT COUNT(*) AS total FROM frameworks').first('total')
console.log(total) // 23
```

### `raw()`

Returns results as an array of arrays, with each row represented by an array. The return type is an array of arrays, and does not include query metadata.

```ts
const rows = db.prepare('SELECT name, year FROM frameworks LIMIT 2').raw()
console.log(rows);

/*
[
  [ "Laravel", 2011 ],
  [ "Nuxt", 2016 ],
]
*/
```

Column names are not included in the result set by default. To include column names as the first row of the result array, use `.raw({ columnNames: true })`.

```ts
const rows = db.prepare('SELECT name, year FROM frameworks LIMIT 2').raw({ columnNames: true })
console.log(rows);

/*
[
  [ "name", "year" ],
  [ "Laravel", 2011 ],
  [ "Nuxt", 2016 ],
]
*/
```

### `run()`

Runs the query (or queries), but returns no results. Instead, `run()` returns the metrics only. Useful for write operations like UPDATE, DELETE or INSERT.

```ts
const result = db
  .prepare('INSERT INTO frameworks (name, year) VALUES ("?1", ?2)')
  .bind('Nitro', 2022)
  .run()

console.log(result)
/*
{
  success: true
  meta: {
    duration: 62,
  }
}
*/
```

### `batch()`

Sends multiple SQL statements inside a single call to the database. This can have a huge performance impact by reducing latency caused by multiple network round trips to the database. Each statement in the list will execute/commit sequentially and non-concurrently before returning the results in the same order.

`batch` acts as a SQL transaction, meaning that if any statement fails, the entire transaction is aborted and rolled back.

```ts
const [info1, info2] = await db.batch([
  db.prepare('UPDATE frameworks SET version = ?1 WHERE name = ?2').bind(3, 'Nuxt'),
  db.prepare('UPDATE authors SET age = ?1 WHERE username = ?2').bind(32, 'atinux'),
])
```

`info1` and `info2` will contain the results of the first and second queries, similar to the results of the [`.all()`](#all) method (see [Return Object](#return-object)).

```ts
console.log(info1)
/*
{
  results: [],
  success: true,
  meta: {
    duration: 62,
    rows_read: 0,
    rows_written: 1
  }
}
*/
```

The object returned is the same as the [`.all()`](#all) method.

### `exec()`

Executes one or more queries directly without prepared statements or parameters binding. The input can be one or multiple queries separated by \n.

If an error occurs, an exception is thrown with the query and error messages, execution stops, and further queries are not executed.

```ts
const result = await hubDatabase().exec(`CREATE TABLE IF NOT EXISTS frameworks (id INTEGER PRIMARY KEY, name TEXT NOT NULL, year INTEGER NOT NULL DEFAULT 0)`)
console.log(result)
/*
{
  count: 1,
  duration: 23
}
*/
```

::callout
This method can have poorer performance (prepared statements can be reused in some cases) and, more importantly, is less safe. Only use this method for maintenance and one-shot tasks (for example, migration jobs).
::

## Using an ORM

Instead of using `useDatabase('db')` to interact with your database directly using SQL, you can use an ORM like [Drizzle ORM](/docs/guides/drizzle). This can improve the developer experience by providing a type-safe API, migrations and more.

## Database Migrations

Database migrations provide version control for your database schema. They track changes and ensure consistent schema evolution across all environments through incremental updates. NuxtHub supports SQL migration files (`.sql`).

### Migrations Directories

NuxtHub scans the `server/database/migrations` directory for migrations **for each [Nuxt layer](https://nuxt.com/docs/getting-started/layers)**.

If you need to scan additional migrations directories, you can specify them in your `nuxt.config.ts` file.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    // Array of additional migration directories to scan
    databaseMigrationsDirs: [
      'my-module/db-migrations/'
    ]
  }
})
```
::note
NuxtHub will scan both `server/database/migrations` and `my-module/db-migrations` directories for `.sql` files.
::

If you want more control to the migrations directories or you are working on a [Nuxt module](https://nuxt.com/docs/guide/going-further/modules), you can use the `hub:database:migrations:dirs` hook:

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
      dirs.push(resolve('db-migrations'))
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
All migrations files are copied to the `.data/hub/database/migrations` directory when you run Nuxt. This consolidated view helps you track all migrations and enables you to use `npx nuxt hub database migrations <command>` commands.
::

### Automatic Application

All `.sql` files in the database migrations directories are automatically applied when you:
- Start the development server (`npx nuxi dev`)
- Build the application via CLI ([`npx nuxi build`](https://nuxt.com/docs/api/commands/build)) or during CI

To apply migrations during CI with an automatically configured provider, ensure the connection string environment variable is set during build time. Alternatively, manually configure `db` [Nitro database](https://nitro.build/guide/database).
- PostgreSQL: `POSTGRESQL_URL` | `POSTGRESQL_URL` | `DATABASE_URL`

::tip
All applied migrations are tracked in the `_hub_migrations` database table.
::

### Creating Migrations

Generate a new migration file using:

```bash [Terminal]
npx nuxt hub database migrations create <name>
```

::important
Migration names must only contain alphanumeric characters and `-` (spaces are converted to `-`).
::

Migration files are created in `server/database/migrations/` and are prefixed by an auto-incrementing sequence number. This migration number is used to determine the order in which migrations are run.

```bash [Example]
> npx nuxthub database migrations create create-todos
✔ Created ./server/database/migrations/0001_create-todos.sql
```

After creation, add your SQL queries to modify the database schema. For example, migrations should be used to create tables, add/delete/modify columns, and add/remove indexes.

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

::note{to="/docs/guides/drizzle#npm-run-dbgenerate"}
With [Drizzle ORM](/docs/guides/drizzle), migrations are automatically created when you run `npx drizzle-kit generate`.
::

<!-- ### Checking Migration Status

View pending and applied migrations across environments:

```bash [Terminal]
# Local environment status
npx nuxthub database migrations list

# Preview environment status
npx nuxthub database migrations list --preview

# Production environment status
npx nuxthub database migrations list --production
```

```bash [Example output]
> npx nuxthub database migrations list --production
ℹ Connected to project atidone.
ℹ Using https://todos.nuxt.dev to retrieve migrations.
✔ Found 1 migration on atidone...
✅ ./server/database/migrations/0001_create-todos.sql 10/25/2024, 2:43:32 PM
🕒 ./server/database/migrations/0002_create-users.sql Pending
``` -->

### Post-Migration Queries

::important
This feature is for advanced use cases. As the queries are run after the migrations process (see [Automatic Application](#automatic-application)), you want to make sure your queries are idempotent.
::

Sometimes you need to run additional queries after migrations are applied without tracking them in the migrations table.

NuxtHub provides the `hub:database:queries:paths` hook for this purpose:

::code-group
```ts [modules/admin/index.ts]
import { createResolver, defineNuxtModule } from 'nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'my-auth-module'
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    nuxt.hook('hub:database:queries:paths', (queries) => {
      // Add SQL files to run after migrations
      queries.push(resolve('./db-queries/seed-admin.sql'))
    })
  }
})
```
```sql [modules/admin/db-queries/seed-admin.sql]
INSERT OR IGNORE INTO admin_users (id, email, password) VALUES (1, 'admin@nuxt.com', 'admin');
```
::

::note
These queries run after all migrations are applied but are not tracked in the `_hub_migrations` table. Use this for operations that should run when deploying your project.
::

### Foreign Key Constraints

If you are using Cloudflare D1 and using [Drizzle ORM](/docs/guides/drizzle) to generate your database migrations, your generated migration files will use `PRAGMA foreign_keys = ON | OFF;`, which is not supported by Cloudflare D1. Instead, they support [defer foreign key constraints](https://developers.cloudflare.com/d1/sql-api/foreign-keys/#defer-foreign-key-constraints).

You need to update your migration file to use `PRAGMA defer_foreign_keys = on|off;` instead:

```diff [Example]
-PRAGMA foreign_keys = OFF;
+PRAGMA defer_foreign_keys = on;

ALTER TABLE ...

-PRAGMA foreign_keys = ON;
+PRAGMA defer_foreign_keys = off;
```
