export interface ModuleOptions {
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
   * Set to `true`, 'preview' or 'production' to use the remote storage.
   * Only set the value on a project you are deploying outside of NuxtHub or Cloudflare.
   * Or wrap it with $development to only use it in development mode.
   * @default process.env.NUXT_HUB_REMOTE or --remote option when running `nuxt dev`
   * @see https://hub.nuxt.com/docs/getting-started/remote-storage
   */
  /**
   * Set `true` to enable the database for the project.
   *
   * @default false
   */
  vectorize?: boolean
  remote?: boolean | 'production' | 'preview'
  /**
   * The URL of the NuxtHub Admin
   * @default 'https://admin.hub.nuxt.com'
   */
  url?: string
  /**
   * The project's key on the NuxtHub platform, added with `nuxthub link`.
   * @default process.env.NUXT_HUB_PROJECT_KEY
   */
  projectKey?: string
  /**
   * The user token to access the NuxtHub platform, added with `nuxthub login`
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
   * The account ID of the Cloudflare account to use for local development.
   * Only necessary if using AI and logged-in user has access to multiple accounts.
   * @default process.env.CLOUDFLARE_ACCOUNT_ID
   */
  accountId?: string
}
