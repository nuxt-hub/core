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

::callout{icon="i-ph-info-duotone"}
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

## Return Object

The methods [`.all()`](#all) and [`.batch()`](#batch) return an object that contains the results (if applicable), the success status and a meta object:

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

::callout
Read more on [Cloudflare D1 documentation](https://developers.cloudflare.com/d1/build-databases/query-databases/).
::

## Migrations

Database migrations are a system for managing incremental, version-controlled changes to database schemas that tracks modifications and ensures consistent database evolution across all environments.

### Applying migrations

Database migrations are automatically applied during:
- Deploying via [CLI](/docs/getting-started/deploy#nuxthub-cli) or [Cloudflare Pages CI](/docs/getting-started/deploy#cloudflare-pages-ci) for projects linked to NuxtHub
- Starting the development server `npm run dev [--remote]`
- Locally previewing a build with [nuxthub preview](/changelog/nuxthub-preview)

::callout
Applied migrations are tracked within the `_hub_migrations` database table.
::

### Create new migration

You can create a new blank database migration file by running this command.

```bash [Terminal]
npx nuxthub database migrations create <name>
```

::note
The migration name can only include alphanumeric characters and `-`. Spaces are converted into `-`.
::

Migration files are created in the `server/database/migrations/` directory.

### List applied and pending migrations

List migrations which are pending, and which have been applied to local/preview/production.

```bash [Terminal]
npx nuxthub database migrations list [--preview] [--production]
```

By default it will show you applied and pending migrations for the local environment.

### Migrating from Drizzle ORM

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
