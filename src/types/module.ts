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
   * Set `true` if the project type is Workers.
   *
   * If `nitro.experimental.websocket` is enabled, the preset will be set to `cloudflare_durable`, otherwise the preset will be `cloudflare_module`.
   *
   * @default false
   */
  workers?: boolean
  /**
   * Set `true` to enable AI for the project.
   *
   * Requires running `npx nuxthub link` for local development.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/features/ai
   */
  ai?: boolean
  /**
   * Set `true` to enable the analytics for the project.
   *
   * @default false
   */
  analytics?: boolean
  /**
   * Set `true` to enable the Blob storage for the project.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/features/blob
   */
  blob?: boolean
  /**
   * Set `true` to enable the Browser rendering for the project.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/features/browser
   */
  browser?: boolean
  /**
   * Set `true` to enable caching for the project.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/features/cache
   */
  cache?: boolean
  /**
   * Set `true` to enable the database for the project.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/features/database
   */
  database?: boolean
  /**
   * Set `true` to enable the Key-Value storage for the project.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/features/kv
   */
  kv?: boolean
  /**
   * Set Vectorize indexes for the project.
   *
   * Currently there is a limit of 10 metadata indexes per vectorize index.
   *
   * @default {}
   * @see https://hub.nuxt.com/docs/features/vectorize
   *
   * @example
   * ```ts
   * vectorize: {
   *   products: {
   *     metric: 'cosine',
   *     dimensions: '768',
   *     metadataIndexes: { name: 'string', price: 'number', isActive: 'boolean' }
   *   },
   *   reviews: {
   *     metric: 'cosine',
   *     dimensions: '768',
   *     metadataIndexes: { rating: 'number' }
   *   }
   * }
   * ```
   */
  vectorize: {
    [key: string]: {
      metric: 'cosine' | 'euclidean' | 'dot-product'
      dimensions: number
      metadataIndexes?: Record<string, 'string' | 'number' | 'boolean'>
    }
  }
  /**
   * Set to `true`, 'preview' or 'production' to use the remote storage.
   * Only set the value on a project you are deploying outside of NuxtHub or Cloudflare.
   * Or wrap it with $development to only use it in development mode.
   * @default process.env.NUXT_HUB_REMOTE or --remote option when running `nuxt dev`
   * @see https://hub.nuxt.com/docs/getting-started/remote-storage
   */
  remote?: boolean | 'production' | 'preview'
  /**
   * The URL of the NuxtHub Admin
   * @default 'https://admin.hub.nuxt.com'
   */
  url?: string
  /**
   * The project's key on the NuxtHub platform, added with `npx nuxthub link`.
   * @default process.env.NUXT_HUB_PROJECT_KEY
   */
  projectKey?: string
  /**
   * The user token to access the NuxtHub platform, added with `npx nuxthub login`
   * @default process.env.NUXT_HUB_USER_TOKEN
   */
  userToken?: string
  /**
   * The URL of the deployed project, used to fetch the remote storage.
   * @default process.env.NUXT_HUB_PROJECT_URL
   */
  projectUrl?: string | (({ env, branch }: { env: 'production' | 'preview', branch: string }) => string)
  /**
   * The secret key defined in the deployed project as env variable, used to fetch the remote storage from the projectUrl
   * @default process.env.NUXT_HUB_PROJECT_SECRET_KEY
   */
  projectSecretKey?: string
  /**
   * The directory used for storage (D1, KV, R2, etc.) in development mode.
   * @default '.data/hub'
   */
  dir?: string
  /**
   * The extra bindings for the project.
   * @default {}
   */
  bindings?: {
    /**
     * The compatibility date for the project.
     * @see https://developers.cloudflare.com/workers/configuration/compatibility-dates/
     */
    compatibilityDate?: string
    /**
     * Extra compatibility flags for the project.
     * Note that NuxtHub will default to the Nitro compatibility flags for Cloudflare if not specified.
     * @see https://developers.cloudflare.com/workers/configuration/compatibility-dates/#compatibility-flags
     */
    compatibilityFlags?: string[]
    /**
     * The hyperdrive bindings for the project, used only when deployed on Cloudflare.
     * @see https://hub.nuxt.com/docs/features/hyperdrive
     * @default {}
     * @example
     * ```ts
     * bindings: {
     *   hyperdrive: {
     *     POSTGRES: '<your-hyperdrive-id>'
     *   }
     * }
     * ```
     */
    hyperdrive?: {
      /**
       * The key of the binding, accessible in the project as `process.env.<key>`.
       * The value is the ID of the hyperdrive instance.
       */
      [key: string]: string
    }
  }
  /**
   * Cloudflare Access authentication for remote storage.
   * @see https://hub.nuxt.com/recipes/cloudflare-access
   */
  cloudflareAccess?: {
    /**
     * The client ID for Cloudflare Access.
     * @default process.env.NUXT_HUB_CLOUDFLARE_ACCESS_CLIENT_ID
     */
    clientId?: string
    /**
     * The client secret for Cloudflare Access.
     * @default process.env.NUXT_HUB_CLOUDFLARE_ACCESS_CLIENT_SECRET
     */
    clientSecret?: string
  }
}
