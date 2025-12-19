---
title: Database CLI
description: Manage your Nuxt SQL database with the `npx nuxt db` CLI, including generating migrations, applying them, running SQL queries, and marking migrations as applied.
navigation.title: CLI
---

NuxtHub provides a CLI for managing your database migrations and running SQL queries accessible from the `npx nuxt db` command.

## `nuxt db generate`

Generate database migrations from the schema.

```bash [Terminal]
USAGE db generate [OPTIONS] 

OPTIONS
          --cwd    The directory to run the command in.
  -v, --verbose    Show verbose output.  
```

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
  NAME    The name of the migration to mark as applied.    

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
