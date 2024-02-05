export default defineNuxtPlugin(() => {
  const event = useRequestEvent()

  useState('hub_config', () => event?.context.hub?.config?.public || {})
})
