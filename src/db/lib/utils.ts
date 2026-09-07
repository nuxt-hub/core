export const CreateDatabaseMigrationsTableQuerySqlite = `CREATE TABLE IF NOT EXISTS _hub_migrations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);`

export const CreateDatabaseMigrationsTableQueryPostgresql = `CREATE TABLE IF NOT EXISTS _hub_migrations (
  id         SERIAL PRIMARY KEY,
  name       TEXT UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);`

export const CreateDatabaseMigrationsTableQueryMysql = `CREATE TABLE IF NOT EXISTS _hub_migrations (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);`

export const CreateDatabaseMigrationsTableQueryLibsql = CreateDatabaseMigrationsTableQuerySqlite

export const AppliedDatabaseMigrationsQuery = 'select id, name, applied_at from _hub_migrations order by id'

/**
 * Get the metadata for a database schema file
 * @param path - The path to the database file
 * @returns The name, dialect and path of the database file
 */
export function getDatabaseSchemaPathMetadata(path: string): { name: string, dialect: string | undefined, path: string } {
  // remove .ts, .js, .mjs extensions
  let name = path.replace(/\.(ts|js|mjs)$/, '')
  // Remove dialect suffix if present (e.g., .postgresql, .sqlite, .mysql)
  const dialect = name.match(/\.(postgresql|sqlite|mysql)$/)?.[1]
  if (dialect) {
    name = name.replace(`.${dialect}`, '')
  }

  return { name, dialect, path }
}

/**
 * Extract the base migration name and dialtect from a filename
 * e.g., '0001_create-todos.postgresql.sql' -> '0001_create-todos'
 * e.g., '0001_create-todos.sql' -> '0001_create-todos'
 */
export function getMigrationMetadata(filename: string): { filename: string, name: string, dialect: string | undefined } {
  // Remove .sql extension
  let name = filename.replace(/\.sql$/, '')
  // Remove dialect suffix if present (e.g., .postgresql, .sqlite, .mysql)
  let dialect = name.match(/\.(postgresql|sqlite|mysql)$/)?.[1]
  if (dialect) {
    name = name.replace(`.${dialect}`, '')
  } else if (/^(?:postgresql|sqlite|mysql):/.test(filename)) {
    // if using directory structure, e.g. postgresql/0001_create-todos.sql, we need to extract the dialect and name
    dialect = filename.split(':')[0]
    name = name.split(':')[1] as string
    filename = filename.replace(/:/g, '/')
  }
  return {
    filename,
    name,
    dialect
  }
}

/**
 * Get the appropriate create table query for the migrations table based on the database dialect
 */
type MigrationDatabaseConfig = { dialect: string, migrationsSchema?: string }

export function dollarQuote(value: string): string {
  let tag = '$nuxthub$'
  while (value.includes(tag)) tag = `${tag.slice(0, -1)}_$`
  return `${tag}${value}${tag}`
}

export function getMigrationsTableName(db: MigrationDatabaseConfig): string {
  if (db.dialect !== 'postgresql' || db.migrationsSchema === undefined) return '_hub_migrations'
  return `"${db.migrationsSchema.replace(/"/g, '""')}"._hub_migrations`
}

export function getAppliedMigrationsQuery(db: MigrationDatabaseConfig): string {
  return `select id, name, applied_at from ${getMigrationsTableName(db)} order by id`
}

export function getCreateMigrationsTableQuery(db: MigrationDatabaseConfig): string {
  switch (db.dialect) {
    case 'postgresql': {
      const table = getMigrationsTableName(db)
      const schema = db.migrationsSchema === undefined ? undefined : `"${db.migrationsSchema.replace(/"/g, '""')}"`
      const relocate = schema && db.migrationsSchema !== 'public'
        ? `
  IF to_regclass('public._hub_migrations') IS NOT NULL AND to_regclass(${dollarQuote(table)}) IS NOT NULL THEN
    RAISE EXCEPTION 'Migration history exists in both public and the configured schema; reconcile it before migrating';
  END IF;
  CREATE SCHEMA IF NOT EXISTS ${schema};
  IF to_regclass('public._hub_migrations') IS NOT NULL THEN
    ALTER TABLE public._hub_migrations SET SCHEMA ${schema};
  END IF;`
        : ''
      return `DO ${dollarQuote(`
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('nuxthub'), hashtext('migrations'));${relocate}
  ${CreateDatabaseMigrationsTableQueryPostgresql.replace('_hub_migrations', () => table)}
END
`)};`
    }
    case 'mysql':
      return CreateDatabaseMigrationsTableQueryMysql
    case 'sqlite':
      return CreateDatabaseMigrationsTableQuerySqlite
    case 'libsql':
      return CreateDatabaseMigrationsTableQueryLibsql
    default:
      throw new Error('Invalid database dialect')
  }
}

/**
 * Split a string containing SQL queries into an array of individual queries after removing comments
 */
export function splitSqlQueries(sqlFileContent: string): string[] {
  const queries: string[] = []
  let inString = false
  let stringFence = ''
  let result = ''

  let currentGeneralWord = ''
  let previousGeneralWord = ''
  let inTrigger = false

  let currentTriggerWord = ''
  let triggerBlockNestingLevel = 0

  for (let i = 0; i < sqlFileContent.length; i += 1) {
    const char = sqlFileContent[i]
    const nextChar = sqlFileContent[i + 1]

    // Skip if char is undefined (shouldn't happen but satisfies TypeScript)
    if (!char) continue

    // Handle string literals
    if ((char === '\'' || char === '"') && (i === 0 || sqlFileContent[i - 1] !== '\\')) {
      if (!inString) {
        inString = true
        stringFence = char
      } else if (char === stringFence) {
        inString = false
      }
    }

    // Only remove comments when not inside a string
    if (!inString) {
      // Handle -- comments
      if (char === '-' && nextChar === '-') {
        while (i < sqlFileContent.length && sqlFileContent[i] !== '\n') {
          i += 1
        }
        continue
      }

      // Handle /* */ comments
      if (char === '/' && nextChar === '*') {
        i += 2
        while (i < sqlFileContent.length && !(sqlFileContent[i] === '*' && sqlFileContent[i + 1] === '/')) {
          i += 1
        }
        i += 2
        continue
      }

      // Track general keywords for CREATE TRIGGER detection
      if (/\w/.test(char)) {
        currentGeneralWord += char.toLowerCase()
      } else {
        // Check if previous word was 'create' and current is 'trigger'
        if (previousGeneralWord === 'create' && currentGeneralWord === 'trigger') {
          inTrigger = true
        }
        previousGeneralWord = currentGeneralWord
        currentGeneralWord = ''
      }

      // If in trigger, track BEGIN/END
      if (inTrigger) {
        if (/\w/.test(char)) {
          currentTriggerWord += char.toLowerCase()
        } else {
          if (currentTriggerWord === 'begin') {
            triggerBlockNestingLevel++
          } else if (currentTriggerWord === 'end') {
            triggerBlockNestingLevel = Math.max(triggerBlockNestingLevel - 1, 0)
          }
          currentTriggerWord = ''
        }
      }

      // Handle semicolon
      if (char === ';' && sqlFileContent[i - 1] !== '\\') {
        if (inTrigger) {
          if (triggerBlockNestingLevel === 0) {
            // End of trigger, split here
            result += char
            const trimmedResult = result.trim()
            if (trimmedResult !== '') {
              queries.push(trimmedResult)
            }
            result = ''
            inTrigger = false
            triggerBlockNestingLevel = 0
            continue
          } else {
            // Inside trigger, do not split
            result += char
          }
        } else {
          // Not in trigger, split as usual
          result += char
          const trimmedResult = result.trim()
          if (trimmedResult !== '') {
            queries.push(trimmedResult)
          }
          result = ''
          continue
        }
      }
    }

    result += char
  }

  // Add any remaining content as a query
  const finalTrimmed = result.trim()
  if (finalTrimmed !== '') {
    queries.push(finalTrimmed)
  }

  // Process each query to ensure it ends with a single semicolon and filter out empty/semicolon-only
  return queries
    .map((query) => {
      // Handle semicolons in trigger bodies
      if (query.includes('TRIGGER') && query.includes('BEGIN')) {
        // First, handle the statements inside the trigger
        query = query.replace(/;+(?=\s+(?:END|\S|$))/g, ';')
      }
      return query.replace(/;+$/, ';')
    })
    .filter(query => query !== ';' && query.trim() !== '')
}
