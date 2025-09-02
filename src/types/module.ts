export interface ModuleHooks {
  /**
   * Add directories to the database migrations.
   * @param dirs - The path of the migrations directories to add.
   * @returns void | Promise<void>
   */
  'hub:database:migrations:dirs': (dirs: string[]) => void | Promise<void>
  /**
   * Add queries to run after the database migrations are applied but are not tracked in the _hub_migrations table.
   * @param queries - The path of the SQL queries paths to add.
   * @returns void | Promise<void>
   */
  'hub:database:queries:paths': (queries: string[]) => void | Promise<void>
}

export interface ModuleOptions {
  /**
   * Set `true` to enable the blob storage for the project.
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
}
