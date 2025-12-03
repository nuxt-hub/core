import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  externals: [
    '@nuxt/kit',
    'nitropack',
    'drizzle-orm',
    'drizzle-kit',
    'db/lib'
  ],
  entries: [
    'src/module',
    {
      input: 'src/db/lib/',
      outDir: 'dist/db/lib',
      builder: 'mkdist'
    },
    {
      input: 'src/db/types/',
      outDir: 'dist/db/types',
      builder: 'mkdist'
    },
    {
      input: 'src/db/runtime/',
      outDir: 'dist/db/runtime',
      builder: 'mkdist'
    }
  ]
})
