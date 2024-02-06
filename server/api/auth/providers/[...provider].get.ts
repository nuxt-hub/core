type OAuthHandler = keyof typeof oauth

export default eventHandler(async event => {
  const { provider } = await getValidatedRouterParams(event, z.object({
    provider: z.string().min(1)
  }).parse)

  const config = getConfig()
  const oauthConfig = config.oauth?.[provider]
  const handlerName = `${provider}EventHandler`
  if (!Object.hasOwn(oauth, handlerName)) {
    throw createError({ statusCode: 400, message: 'Could not resolve this provider.' })
  }

  // TODO: handle redirect with ?redirect query param (must start with /)
  return oauth[handlerName as OAuthHandler]({
    config: oauthConfig as any,
    async onSuccess(event, result) {
      const sessionData = {}
      await hubHooks.callHook('auth:provider', provider, result, sessionData)
      await setUserSession(event, sessionData)
      return sendRedirect(event, config.oauth.redirect)
    }
  })(event)
})
