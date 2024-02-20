# NuxtHub


[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

The Nuxt Toolkit to create full-stack applications on the Edge.

## Features

- Query an SQLite database with `useDatabase()`
- Access key-value storage with `useKV()`
- Store files with `useBlob()`

Read more on https://docs.hub.nuxt.com

## Quick Setup

1. Add `@nuxt/hub` dependency to your project

```bash
# Using pnpm
pnpm add @nuxt/hub

# Using yarn
yarn add @nuxt/hub

# Using npm
npm install @nuxt/hub

# Using bun
npm add @nuxt/hub
```

2. Add `@nuxt/hub` to the `modules` section of `nuxt.config.ts`

```js
export default defineNuxtConfig({
  modules: [
    '@nuxt/hub'
  ]
})
```

That's it! You can now NuxtHub features in your Nuxt app ✨

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
