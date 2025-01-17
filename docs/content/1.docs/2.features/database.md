---
title: SQL Database
navigation.title: Database
description: Access a SQL database in your Nuxt application to store and retrieve relational data.
---

## Getting Started

Enable the database in your NuxtHub project by adding the `database` property to the `hub` object in your `nuxt.config.ts` file.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    database: true
  }
})
```

::note
This option will use Cloudflare platform proxy in development and automatically create a [Cloudflare D1](https://developers.cloudflare.com/d1) database for your project when you [deploy it](/docs/getting-started/deploy).
::

::tip
Checkout our [Drizzle ORM recipe](/docs/recipes/drizzle) to get started with the database by providing a schema and migrations.
::

::tabs
::div{label="Nuxt DevTools"}
:nuxt-img{src="/images/landing/nuxt-devtools-database.png" alt="Nuxt DevTools Database" width="915" height="515" data-zoom-src="/images/landing/nuxt-devtools-database.png"}
::
::div{label="NuxtHub Admin"}
:nuxt-img{src="/images/landing/nuxthub-admin-database.png" alt="NuxtHub Admin Database" width="915" height="515" data-zoom-src="/images/landing/nuxthub-admin-database.png"}
::
::

## `hubDatabase()`

Server composable that returns a [D1 database client](https://developers.cloudflare.com/d1/build-databases/query-databases/).

```ts
const db = hubDatabase()
```

::callout
This documentation is a small reflection of the [Cloudflare D1 documentation](https://developers.cloudflare.com/d1/build-databases/query-databases/). We recommend reading it to understand the full potential of the D1 database.
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

Binds parameters to a prepared statement.

```ts
const stmt = db.prepare('SELECT * FROM users WHERE name = ?1')

stmt.bind('Evan You')
```

::note
The `?` character followed by a number (1-999) represents an ordered parameter. The number represents the position of the parameter when calling `.bind(...params)`.
::

```ts
const stmt = db
  .prepare('SELECT * FROM users WHERE name = ?2 AND age = ?1')
  .bind(3, 'Leo Chopin')
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

Sends multiple SQL statements inside a single call to the database. This can have a huge performance impact as it reduces latency from network round trips to the database. Each statement in the list will execute and commit, sequentially, non-concurrently and return the results in the same order.

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

If an error occurs, an exception is thrown with the query and error messages, execution stops and further statements are not executed.

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
This method can have poorer performance (prepared statements can be reused in some cases) and, more importantly, is less safe. Only use this method for maintenance and one-shot tasks (for example, migration jobs). The input can be one or multiple queries separated by \n.
::

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
All migrations files are copied to the `.data/hub/database/migrations` directory when you run Nuxt. This consolidated view helps you track all migrations and enables you to use `npx nuxthub database migrations <command>` commands.
::

### Automatic Application

All `.sql` files in the database migrations directories are automatically applied when you:
- Start the development server (`npx nuxt dev` or [`npx nuxt dev --remote`](/docs/getting-started/remote-storage))
- Preview builds locally ([`npx nuxthub preview`](/changelog/nuxthub-preview))
- Deploy via [`npx nuxthub deploy`](/docs/getting-started/deploy#nuxthub-cli) or [Cloudflare Pages CI](/docs/getting-started/deploy#cloudflare-pages-ci)

::tip
All applied migrations are tracked in the `_hub_migrations` database table.
::

### Creating Migrations

Generate a new migration file using:

```bash [Terminal]
npx nuxthub database migrations create <name>
```

::important
Migration names must only contain alphanumeric characters and `-` (spaces are converted to `-`).
::

Migration files are created in `server/database/migrations/`.

```bash [Example]
> npx nuxthub database migrations create create-todos
✔ Created ./server/database/migrations/0001_create-todos.sql
```

After creation, add your SQL queries to modify the database schema.

::note{to="/docs/recipes/drizzle#npm-run-dbgenerate"}
With [Drizzle ORM](/docs/recipes/drizzle), migrations are automatically created when you run `npx drizzle-kit generate`.
::

### Checking Migration Status

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
```

### Marking Migrations as Applied

For databases with existing migrations, prevent NuxtHub from rerunning them by marking them as applied:

```bash [Terminal]
# Mark applied in local environment
npx nuxthub database migrations mark-all-applied

# Mark applied in preview environment
npx nuxthub database migrations mark-all-applied --preview

# Mark applied in production environment
npx nuxthub database migrations mark-all-applied --production
```

::collapsible{name="self-hosting docs"}
When [self-hosting](/docs/getting-started/deploy#self-hosted), set these environment variables before running commands: :br :br

```bash [Terminal]
NUXT_HUB_PROJECT_URL=<url> NUXT_HUB_PROJECT_SECRET_KEY=<secret> nuxthub database migrations mark-all-applied
```
::

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
