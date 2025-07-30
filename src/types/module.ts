export interface ModuleOptions {
  /**
   * Set `'vercel'` or `'cloudflare'` to enable the AI for the project.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/features/ai
   */
  ai?: false | 'vercel' | 'cloudflare'
  /**
   * Set `'vercel'` or `'cloudflare'` to enable AI for the project.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/features/blob
   */
  blob?: boolean
  /**
   * Set `true` to enable caching for the project.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/features/cache
   */
  cache?: boolean
  /**
   * Set `true` to enable database for the project. Set to `'postgresql'`, `'sqlite'`, or `'mysql'` to use a specific database dialect with a zero-config development database.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/features/database
   */
  database?: boolean | 'postgresql' | 'sqlite' | 'mysql'
  /**
   * Set `true` to enable the key-value storage for the project.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/features/kv
   */
  kv?: boolean
  /**
   * The directory used for storage (database, kv, etc.) during local development.
   * @default '.data'
   */
  dir?: string
  /**
   * The directories to scan for database migrations.
   * @default ['server/database/migrations']
   */
  databaseMigrationsDirs?: string[]
  /**
   * Set `true` to apply database migrations during build time.
   *
   * @default true
   * @see https://hub.nuxt.com/docs/features/database
   */
  applyDatabaseMigrationsDuringBuild?: boolean
}
