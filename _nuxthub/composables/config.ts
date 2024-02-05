export function useConfig() {
  return useState<Config['public']>('hub_config')
}
