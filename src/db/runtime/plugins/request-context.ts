import { defineNitroPlugin, useEvent } from '#imports'

declare global {
  var __nuxthubUseNitroEvent: (() => unknown) | undefined
}

export default defineNitroPlugin(() => {
  globalThis.__nuxthubUseNitroEvent = () => {
    try {
      return useEvent()
    } catch {
      return undefined
    }
  }
})
