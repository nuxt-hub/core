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

export type MigrationsTableConfig = {
  dialect: string
  migrationsSchema?: string
}

const MigrationsTable = '_hub_migrations'

export function quotePostgresqlIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`
}

export function getMigrationsTableName(db: MigrationsTableConfig): string {
  if (db.dialect === 'postgresql' && db.migrationsSchema) {
    return `${quotePostgresqlIdentifier(db.migrationsSchema)}.${quotePostgresqlIdentifier(MigrationsTable)}`
  }
  return MigrationsTable
}

export function getAppliedMigrationsQuery(db: MigrationsTableConfig): string {
  return `select id, name, applied_at from ${getMigrationsTableName(db)} order by id`
}

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

export const PostgresqlMigrationsLockedMessage = 'nuxthub: migrations are locked by another instance'

const PostgresqlMigrationsLock = `IF NOT pg_try_advisory_xact_lock(hashtext('nuxthub'), hashtext('migrations')) THEN
    RAISE EXCEPTION '${PostgresqlMigrationsLockedMessage}' USING ERRCODE = 'lock_not_available';
  END IF;`

export const NoTransactionMigrationDirective = '-- nuxthub:no-transaction'

export const MoveMigrationsHistoryCommand = 'npx nuxt db move-migrations-history'

export function dollarQuote(value: string): string {
  let tag = '$nuxthub$'
  while (value.includes(tag)) tag = `${tag.slice(0, -1)}_$`
  return `${tag}${value}${tag}`
}

export function isNoTransactionMigration(sqlFileContent: string): boolean {
  for (const line of sqlFileContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (!trimmed.startsWith('--')) return false
    if (trimmed === NoTransactionMigrationDirective) return true
  }
  return false
}

function lockedPostgresqlBlock(statements: string, declarations = ''): string {
  return `DO ${dollarQuote(`${declarations ? `\nDECLARE\n${declarations}` : ''}
BEGIN
  ${PostgresqlMigrationsLock}
${statements}
END
`)};`
}

function qualifiedTableName(table: string): string {
  return `(SELECT quote_ident(n.nspname) || '.' || quote_ident(c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.oid = ${table})`
}

function getMigrationsHistoryGuard(db: MigrationsTableConfig & { migrationsSchema: string }, { allowMove = false } = {}): string {
  const schema = quotePostgresqlIdentifier(db.migrationsSchema)
  const target = getMigrationsTableName(db)
  return `  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = ${dollarQuote(db.migrationsSchema)}) THEN
    RAISE EXCEPTION USING MESSAGE = ${dollarQuote(`PostgreSQL schema ${schema} from \`hub.db.migrationsSchema\` does not exist. Create it before migrating, for example with \`CREATE SCHEMA ${schema};\`. Use a schema reserved for the migration history, not one that your migrations create.`)};
  END IF;
  existing := to_regclass('${MigrationsTable}');
  target := to_regclass(${dollarQuote(target)});
  IF existing IS NOT NULL AND existing IS DISTINCT FROM target THEN
    IF target IS NOT NULL THEN
      RAISE EXCEPTION USING MESSAGE = ${dollarQuote('Migration history exists in both ')} || ${qualifiedTableName('existing')} || ${dollarQuote(` and ${target}. Keep the rows you need in one table and drop the other, then try again.`)};
    END IF;
${allowMove
  ? ''
  : `    RAISE EXCEPTION USING MESSAGE = ${dollarQuote('Migration history exists in ')} || ${qualifiedTableName('existing')} || ${dollarQuote(`, but \`hub.db.migrationsSchema\` expects it in ${target}. Run \`${MoveMigrationsHistoryCommand}\` to move it, once no older version of your app runs migrations on this database.`)};
`}  END IF;`
}

const migrationsHistoryDeclarations = `  existing regclass;
  target regclass;`

export function getAtomicPostgresqlMigrationQuery(db: MigrationsTableConfig, name: string, sqlFileContent: string): string {
  const table = getMigrationsTableName(db)
  return lockedPostgresqlBlock(`  IF NOT EXISTS (SELECT 1 FROM ${table} WHERE name = ${dollarQuote(name)}) THEN
    EXECUTE ${dollarQuote(sqlFileContent)};
    INSERT INTO ${table} (name) VALUES (${dollarQuote(name)});
  END IF;`)
}

export function getRecordPostgresqlMigrationQuery(db: MigrationsTableConfig, name: string): string {
  return lockedPostgresqlBlock(`  INSERT INTO ${getMigrationsTableName(db)} (name) VALUES (${dollarQuote(name)}) ON CONFLICT (name) DO NOTHING;`)
}

/**
 * Get the appropriate create table query for the migrations table based on the database dialect
 */
export function getCreateMigrationsTableQuery(db: MigrationsTableConfig): string {
  switch (db.dialect) {
    case 'postgresql': {
      const create = CreateDatabaseMigrationsTableQueryPostgresql.replace(MigrationsTable, () => getMigrationsTableName(db))
      if (!db.migrationsSchema) return lockedPostgresqlBlock(create)
      return lockedPostgresqlBlock(`${getMigrationsHistoryGuard({ ...db, migrationsSchema: db.migrationsSchema })}\n${create}`, migrationsHistoryDeclarations)
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

export function getMigrationsHistoryLocationQuery(db: MigrationsTableConfig & { migrationsSchema: string }): string {
  const target = dollarQuote(getMigrationsTableName(db))
  return `SELECT
  ${qualifiedTableName(`to_regclass('${MigrationsTable}')`)} AS search_path_table,
  to_regclass('${MigrationsTable}') IS NOT DISTINCT FROM to_regclass(${target}) AS search_path_is_target,
  to_regclass(${target}) IS NOT NULL AS target_exists,
  current_schema() AS current_schema`
}

export function getMoveMigrationsHistoryQuery(db: MigrationsTableConfig & { migrationsSchema: string }, { revert = false } = {}): string {
  const target = getMigrationsTableName(db)
  if (!revert) {
    return lockedPostgresqlBlock(`${getMigrationsHistoryGuard(db, { allowMove: true })}
  IF existing IS NOT NULL AND existing IS DISTINCT FROM target THEN
    EXECUTE format('ALTER TABLE %s SET SCHEMA %I', existing, ${dollarQuote(db.migrationsSchema)});
  ELSIF target IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = ${dollarQuote(`No migration history found through search_path to move to ${target}.`)};
  END IF;`, migrationsHistoryDeclarations)
  }
  return lockedPostgresqlBlock(`  destination_schema := current_schema();
  IF destination_schema IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = ${dollarQuote('The search_path has no existing schema to move the migration history back to.')};
  END IF;
  target := to_regclass(${dollarQuote(target)});
  destination := to_regclass(format('%I.%I', destination_schema, '${MigrationsTable}'));
  IF target IS NULL THEN
    IF destination IS NULL THEN
      RAISE EXCEPTION USING MESSAGE = ${dollarQuote(`No migration history found in ${target}.`)};
    END IF;
  ELSIF destination IS NOT NULL AND destination IS DISTINCT FROM target THEN
    RAISE EXCEPTION USING MESSAGE = ${dollarQuote(`Migration history exists in both ${target} and `)} || ${qualifiedTableName('destination')} || ${dollarQuote('. Keep the rows you need in one table and drop the other, then try again.')};
  ELSIF destination IS NULL THEN
    EXECUTE format('ALTER TABLE %s SET SCHEMA %I', target, destination_schema);
  END IF;`, `  destination_schema text;
  destination regclass;
  target regclass;`)
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
