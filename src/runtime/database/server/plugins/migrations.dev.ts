import { useRuntimeConfig } from '@nuxt/kit'
import { applyRemoteMigrations } from '../../../../utils/migrations'
import { hubHooks } from '../../../base/server/utils/hooks'
import { applyMigrations } from '../utils/migrations'
import { useRuntimeConfig, defineNitroPlugin } from '#imports'

export default defineNitroPlugin(async () => {
  if (!import.meta.dev) return

  const hub = useRuntimeConfig().hub
  if (!hub.database) return

  hubHooks.hookOnce('bindings:ready', async () => {
    if (hub.remote && hub.projectKey) { // linked to a NuxtHub project
      await applyRemoteMigrations()
    } else { // local dev & self hosted
      await applyMigrations()
    }

    await hubHooks.callHookParallel('migrations:done')
  })
})
