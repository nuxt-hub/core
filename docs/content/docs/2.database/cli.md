---
title: Database CLI
description: Manage your Nuxt SQL database with the `npx nuxt db` CLI, including generating migrations, applying them, running SQL queries, and marking migrations as applied.
navigation.title: CLI
---

NuxtHub provides a CLI for managing your database migrations and running SQL queries accessible from the `npx nuxt db` command.

## `nuxt db generate`

Generate database migrations from the schema.

```bash [Terminal]
USAGE db generate [OPTIONS] [CUSTOM] [NAME]

OPTIONS
       --custom    Whether to generate an empty migration file for custom SQL.
         --name    Custom name for the migration file.
          --cwd    The directory to run the command in.
  -v, --verbose    Show verbose output.
```

Example usage:

```bash [Terminal]
# Generate a migration with default name
npx nuxt db generate
# Generate a migration based on schema changes
npx nuxt db generate --name add_new_column
# Generate an empty migration file for custom SQL
npx nuxt db generate --custom --name seed_initial_data
```

::tip
Read more about generating migrations in the [Drizzle Kit's official documentation](https://orm.drizzle.team/docs/drizzle-kit-generate).
::

## `nuxt db migrate`

Apply database migrations to the database.

```bash [Terminal]
USAGE db migrate [OPTIONS]

OPTIONS

          --cwd    The directory to run the command in.
       --dotenv    Point to another .env file to load.
  -v, --verbose    Show verbose output.
```

## `nuxt db mark-as-migrated`

Mark local database migration(s) as applied to the database.

```bash [Terminal]
USAGE db mark-as-migrated [OPTIONS] [NAME]

ARGUMENTS
  NAME    The name of the migration to mark as applied. If not provided, marks all pending migrations as applied. (optional)

OPTIONS
          --cwd    The directory to run the command in.
       --dotenv    Point to another .env file to load.
  -v, --verbose    Show verbose output.
```

## `nuxt db drop`

Drop a table from the database.

```bash [Terminal]
USAGE db drop [OPTIONS] <TABLE>

ARGUMENTS
  TABLE    The name of the table to drop.

OPTIONS
          --cwd    The directory to run the command in.
       --dotenv    Point to another .env file to load.
  -v, --verbose    Show verbose output.
```

## `nuxt db drop-all`

Drop all tables from the database.

```bash [Terminal]
USAGE db drop-all [OPTIONS]

OPTIONS
          --cwd    The directory to run the command in.
       --dotenv    Point to another .env file to load, relative to the root directory.
  -v, --verbose    Show verbose output.
```

::warning
This is a destructive operation that will permanently delete all data in your database. Take a backup of your database before using this command.
::

## `nuxt db squash`

Squash several migrations into a single migration. This is useful for cleaning up your migration history during development.

```bash [Terminal]
USAGE db squash [OPTIONS]

OPTIONS
         --last    Number of migrations to squash starting from most recently applied. If not specified migrations can be interactively selected.
          --cwd    The directory to run the command in.
  -v, --verbose    Show verbose output.
```

Example usage:

```bash [Terminal]
# Squash the last 3 migrations into one
npx nuxt db squash --last 3

# Interactive mode - select which migrations to squash
npx nuxt db squash
```

After squashing, you'll be prompted to mark the new migration as already applied. This is useful when your database already has the schema from the squashed migrations applied.

::note
When using interactive selection, all migrations after the oldest selected one will automatically be included, since migrations must be squashed sequentially.
::

## `nuxt db sql`

Execute a SQL query against the database.

```bash [Terminal]
USAGE db sql [OPTIONS] [QUERY]

ARGUMENTS
  QUERY    The SQL query to execute. If not provided, reads from stdin.

OPTIONS
          --cwd    The directory to run the command in.
       --dotenv    Point to another .env file to load, relative to the root directory.
  -v, --verbose    Show verbose output.
```

Example usage:

```bash [Terminal]
npx nuxt db sql "SELECT * FROM users"
# or
npx nuxt db sql < dump.sql
```
