interface DatabaseConnection {
  /**
   * Database connection URL
   */
  url?: string
  /**
   * Auth token (for Turso/libSQL)
   */
  authToken?: string
  /**
   * Connection string (for PostgreSQL)
   */
  connectionString?: string
  /**
   * Database host
   */
  host?: string
  /**
   * Database port
   */
  port?: number
  /**
   * Database username
   */
  user?: string
  /**
   * Database password
   */
  password?: string
  /**
   * Database name
   */
  database?: string
  /**
   * Cloudflare Account ID (for D1 HTTP driver)
   */
  accountId?: string
  /**
   * Cloudflare API Token (for D1 HTTP driver)
   */
  apiToken?: string
  /**
   * Cloudflare D1 Database ID (for D1 HTTP driver)
   */
  databaseId?: string
  /**
   * Additional connection options
   */
  [key: string]: any
}

export interface DatabaseConfig {
  /**
   * Database dialect
   */
  dialect: 'sqlite' | 'postgresql' | 'mysql'
  /**
   * Database driver (optional, auto-detected if not provided)
   *
   * SQLite drivers: 'better-sqlite3', 'libsql', 'bun-sqlite', 'd1', 'd1-http'
   * PostgreSQL drivers: 'postgres-js', 'pglite'
   * MySQL drivers: 'mysql2'
   */
  driver?: string
  /**
   * Database connection configuration
   */
  connection?: DatabaseConnection
  /**
   * The directories to scan for database migrations.
   * @default ['server/db/migrations']
   */
  migrationsDirs?: string[]
  /**
   * The paths to the SQL queries to apply after the database migrations complete.
   */
  queriesPaths?: string[]
  /**
   * Set `false` to disable applying database migrations during production build time.
   *
   * @default true
   */
  applyMigrationsDuringBuild?: boolean
}

export interface ResolvedDatabaseConfig extends DatabaseConfig {
  dialect: 'sqlite' | 'postgresql' | 'mysql'
  driver: string
  connection: DatabaseConnection
  migrationsDirs: string[]
  queriesPaths: string[]
  applyMigrationsDuringBuild: boolean
}
