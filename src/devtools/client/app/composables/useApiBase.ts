import { computed } from 'vue'

export function useApiBase() {
  return computed(() => {
    if (import.meta.client) {
      try {
        return window.parent.location.origin
      } catch {
        return window.location.origin
      }
    }
    return ''
  })
}
