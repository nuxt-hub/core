// Declare module to extend Nuxt hooks
declare module '@nuxt/schema' {
  interface NuxtHooks {
    /**
     * Add additional schema files to scan for database schema files.
     * @param paths - Array of schema file paths to include.
     * @returns void | Promise<void>
     */
    'hub:db:schema:extend': ({ dialect, paths }: { dialect: string, paths: string[] }) => void | Promise<void>
    /**
     * Add additional directories to scan for database migration files.
     * @param dirs - Array of directory paths containing .sql migration files to include.
     * @returns void | Promise<void>
     */
    'hub:db:migrations:dirs': (dirs: string[]) => void | Promise<void>
    /**
     * Add queries that are not tracked in the `_hub_migrations` table which are applied after the database migrations complete.
     * @param queries - The path of the SQL queries paths to add.
     * @returns void | Promise<void>
     */
    'hub:db:queries:paths': (queries: string[], dialect: 'sqlite' | 'postgresql' | 'mysql') => void | Promise<void>
  }
}
