// Declare module to extend Nuxt hooks
declare module '@nuxt/schema' {
  interface NuxtHooks {
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
