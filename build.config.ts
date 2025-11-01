import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  externals: [
    'nitropack',
    'drizzle-orm',
    'drizzle-kit',
    'consola'
  ]
})
