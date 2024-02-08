type OAuthHandler = keyof typeof oauth

export default eventHandler(async event => {
  const { provider } = await getValidatedRouterParams(event, z.object({
    provider: z.string().min(1)
  }).parse)

  const handlerName = `${provider}EventHandler`
  if (!Object.hasOwn(oauth, handlerName)) {
    throw createError({ statusCode: 400, message: 'Could not resolve this provider.' })
  }

  const { redirectSuccess } = await getValidatedQuery(event, z.object({
    redirectSuccess: z.string().startsWith('/').default('/')
  }).parse)
  return oauth[handlerName as OAuthHandler]({
    async onSuccess(event, result) {
      const sessionData = {}
      await hubHooks.callHook('auth:provider', provider, result, sessionData)
      await setUserSession(event, sessionData)
      return sendRedirect(event, redirectSuccess)
    }
  })(event)
})
