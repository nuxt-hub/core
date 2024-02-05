export function useHub() {
  const config = useState<HubConfig['public']>('hub_config')

  return {
    config
  }
}
