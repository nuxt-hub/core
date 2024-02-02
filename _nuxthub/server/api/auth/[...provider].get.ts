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

  return oauth[handlerName as OAuthHandler]({
    config: oauthConfig as any,
    async onSuccess(event, { user }) {
      await setUserSession(event, { user })
      return sendRedirect(event, '/todos')
    }
  })(event)
})
