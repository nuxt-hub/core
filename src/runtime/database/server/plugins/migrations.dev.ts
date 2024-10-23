import { useRuntimeConfig } from '@nuxt/kit'
import { hubHooks } from '../../../base/server/utils/hooks'
import { defineNitroPlugin } from '#imports'
import { runLocalMigrations, runMigrations } from '~/src/utils/migrations'

export default defineNitroPlugin(async () => {
  if (!import.meta.dev) return

  hubHooks.hookOnce('bindings:ready', async () => {
    const hub = useRuntimeConfig().hub
    if (hub.remote) {
      await runMigrations()
    } else {
      await runLocalMigrations()
    }

    await hubHooks.callHookParallel('migrations:done')
  })
})
