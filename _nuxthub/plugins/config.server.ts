export default defineNuxtPlugin((nuxtApp) => {
  const event = useRequestEvent()

  useState('hub_config', () => event?.context.config?.public || {})
})
