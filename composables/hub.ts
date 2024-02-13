export function useHub() {
  const config = useState<HubConfig['public']>('hub_config')
  const session = useUserSession()

  return {
    config,
    auth: {
      ...session,
      loginWith(provider: string, { redirectSuccess }: { redirectSuccess?: string } = {}) {
        window.location.href = `/api/auth/providers/${provider}?${redirectSuccess ? `redirectSuccess=${redirectSuccess}` : ''}`
      },
      logout() {
        return session.clear()
      }
    }
  }
}
