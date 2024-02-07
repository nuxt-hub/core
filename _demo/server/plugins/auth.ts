export default defineNitroPlugin(() => {
  hubHooks.hook('auth:provider', (_provider, { user }, sessionData) => {
    sessionData.user = user
  })
})
