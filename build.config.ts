import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  externals: [
    '@nuxt/kit',
    'nitropack',
    'drizzle-orm',
    'drizzle-kit',
    './db/lib',
    'db/lib'
  ],
  entries: [
    'src/module',
    // DB
    {
      input: 'src/db/lib/',
      outDir: 'dist/db/lib',
      builder: 'mkdist'
    },
    {
      input: 'src/db/runtime/',
      outDir: 'dist/db/runtime',
      builder: 'mkdist'
    },
    // KV
    {
      input: 'src/kv/runtime/',
      outDir: 'dist/kv/runtime',
      builder: 'mkdist'
    },
    // Blob
    {
      input: 'src/blob/lib/',
      outDir: 'dist/blob/lib',
      builder: 'mkdist'
    },
    {
      input: 'src/blob/runtime/',
      outDir: 'dist/blob/runtime',
      builder: 'mkdist'
    },
    {
      input: 'src/blob/types/',
      outDir: 'dist/blob/types',
      builder: 'mkdist'
    },
    // Cache
    {
      input: 'src/cache/runtime/',
      outDir: 'dist/cache/runtime',
      builder: 'mkdist'
    }
  ]
})
