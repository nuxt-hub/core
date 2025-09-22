// Declare module to extend Nuxt hooks
declare module '@nuxt/schema' {
  interface NuxtHooks {
    /**
     * Add additional directories to scan for database migration files.
     * @param dirs - Array of directory paths containing .sql migration files to include.
     * @returns void | Promise<void>
     */
    'hub:database:migrations:dirs': (dirs: string[]) => void | Promise<void>
    /**
     * Add queries that are not tracked in the `_hub_migrations` table which are applied after the database migrations complete.
     * @param queries - The path of the SQL queries paths to add.
     * @returns void | Promise<void>
     */
    'hub:database:queries:paths': (queries: string[]) => void | Promise<void>
  }
}

declare module 'nitropack/types' {
  interface NitroRuntimeHooks {
    /**
     * Called when the database migrations are completed.
     * @returns void
     */
    'hub:database:migrations:done': () => void
  }
}
