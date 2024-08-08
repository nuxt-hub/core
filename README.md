# NuxtHub

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Build full-stack applications with Nuxt on Cloudflare, with zero configuration.

## Features

NuxtHub provides optional features to help you build full-stack applications:
- [Deploy your Nuxt app](https://hub.nuxt.com/docs/getting-started/deploy) to your Cloudflare account with [`npx nuxthub deploy`](https://github.com/nuxt-hub/cli) or with the [NuxtHub Admin](https://admin.hub.nuxt.com)
- [AI Models](https://hub.nuxt.com/docs/features/ai) to run machine learning models, such as LLMs in Nuxt.
- [Blob storage](https://hub.nuxt.com/docs/features/blob) to store static assets, such as images, videos and more
- [Caching system](https://hub.nuxt.com/docs/features/cache) for your Nuxt pages, API routes or server functions
- [SQL database](https://hub.nuxt.com/docs/features/database) to store your application's data
- [Key-Value](https://hub.nuxt.com/docs/features/kv) to store JSON data accessible globally with low-latency
- [Open API](https://hub.nuxt.com/docs/features/open-api) to generate your API documentation with [Scalar](https://scalar.com)
- [Remote Storage](https://hub.nuxt.com/docs/getting-started/remote-storage) to connect to your project's resources from your local environment, allowing you to work with your remote storage as if it was local with `npx nuxi dev --remote`.

Read more on https://hub.nuxt.com

## Quick Setup

Duplicate our [nuxt-hub/starter](https://github.com/nuxt-hub/starter) or create a new NuxtHub project with:

```bash
npx nuxthub init my-app
```

## Add to a Nuxt project

1. Install `@nuxthub/core` dependency to your project:

```bash
npx nypm@latest add @nuxthub/core
```

2. Install `wrangler` development dependency to your project:

```bash
npx nypm@latest add -D wrangler
```

3. Add `@nuxthub/core` to the `modules` section of `nuxt.config.ts`

```js
export default defineNuxtConfig({
  modules: [
    '@nuxthub/core'
  ]
})
```

That's it! You can now use NuxtHub features in your Nuxt app ✨

## Feedback

- 💡 [Feature request](https://github.com/nuxt-hub/core/issues/new?assignees=&labels=enhancement&projects=&template=%F0%9F%92%A1-feature-request.md&title=): Suggest an idea or improvement.
- 🐞 [Bug report](https://github.com/nuxt-hub/core/issues/new?assignees=&labels=bug&projects=&template=%F0%9F%90%9E-bug-report.md&title=): Create a report to help us improve the platform.
- 🏞️ [New Template](https://github.com/nuxt-hub/core/issues/new?assignees=&labels=template&projects=&template=%F0%9F%8F%9E%EF%B8%8F-new-template.md&title=): Share a template you made based on NuxtHub.


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
