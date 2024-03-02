# NuxtHub

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Build full-stack applications with Nuxt on Cloudflare, with zero configuration.

## Features

- Query an SQLite database with `hubDatabase()`
- Access key-value storage with `hubKV()`
- Store files with `hubBlob()`

Read more on https://hub.nuxt.com

## Quick Setup

1. Install `@nuxthub/core` dependency to your project:

```bash
npx nypm@latest add @nuxthub/core
```

2. Install `wrangler` development dependency to your project:

```bash
npx nypm@latest add -D wrangler
```

3. Add `@nuxthub/core` to the `extends` section of `nuxt.config.ts`

```js
export default defineNuxtConfig({
  extends: [
    '@nuxthub/core'
  ]
})
```

That's it! You can now use NuxtHub features in your Nuxt app ✨

## Contributing

```bash
# Install dependencies
pnpm i

# Generate type stubs
pnpm dev:prepare

# Develop with the playground
pnpm dev

# Build the playground
pnpm dev:build

# Run ESLint
pnpm lint

# Run Vitest
pnpm test
pnpm test:watch

# Release new version
pnpm release
```

## License

[Apache 2.0](./LICENSE)

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@nuxthub/core/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/@nuxthub/core

[npm-downloads-src]: https://img.shields.io/npm/dm/@nuxthub/core.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npmjs.com/package/@nuxthub/core

[license-src]: https://img.shields.io/npm/l/@nuxthub/core.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/@nuxthub/core

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
