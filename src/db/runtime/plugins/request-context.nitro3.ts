import { definePlugin } from 'nitro'
import { useRequest } from 'nitro/context'

export default definePlugin(() => {
  globalThis.__nuxthubUseNitroEvent = () => {
    try {
      return useRequest()
    } catch {
      return undefined
    }
  }
})
