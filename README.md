# Full-Stack Nuxt made easy ✨

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Build and deploy powerful full-stack Nuxt applications with ease.

NuxtHub supercharges your Nuxt development workflow so you can focus on shipping features.

## ✨ Key Features

NuxtHub provides optional features to help you build full-stack applications:
- [**Files storage**](https://hub.nuxt.com/docs/features/blob) to store static assets, such as images, videos and more
- [**Caching system**](https://hub.nuxt.com/docs/features/cache) for your Nuxt pages, API routes or server functions
- [**SQL database**](https://hub.nuxt.com/docs/features/database) to store your application's data with [automatic migrations](https://hub.nuxt.com/docs/features/database#database-migrations)
- [**Key-Value**](https://hub.nuxt.com/docs/features/kv) to store JSON data accessible globally with low-latency
- [**Open API**](https://hub.nuxt.com/docs/features/open-api) to generate your API documentation with [Scalar](https://scalar.com)
- [**Remote Storage**](https://hub.nuxt.com/docs/getting-started/remote-storage) to connect to your project's resources from your local environment, allowing you to work with your remote storage as if it was local.

Read more on https://hub.nuxt.com

## 📚 Resources

- [NuxtHub Website](https://hub.nuxt.com)
- [NuxtHub CLI](https://github.com/nuxt-hub/cli)
- [NuxtHub Templates](https://hub.nuxt.com/templates)

## 🚀 Quickstart

Head over to our [Getting Started](https://hub.nuxt.com/docs/getting-started/installation) guide to learn more.

Duplicate our [`nuxt-hub/hello-edge`](https://github.com/nuxt-hub/hello-edge) template or create a new NuxtHub project with:

```bash
npx nuxthub init my-app
cd my-app
npm run dev
```

Open http://localhost:3000 with your browser.

Deploy your app to production with:

```bash
npm build
```

Learn more on [how to deploy a Nuxt app with NuxtHub](https://hub.nuxt.com/docs/getting-started/deploy).

## 🤝 Community

- 💡 [Feature request](https://github.com/nuxt-hub/core/issues/new?assignees=&labels=enhancement&projects=&template=%F0%9F%92%A1-feature-request.md&title=): Suggest an idea or improvement.
- 🐞 [Bug report](https://github.com/nuxt-hub/core/issues/new?assignees=&labels=bug&projects=&template=%F0%9F%90%9E-bug-report.md&title=): Create a report to help us improve the platform.
- 🏞️ [New Template](https://github.com/nuxt-hub/core/issues/new?assignees=&labels=template&projects=&template=%F0%9F%8F%9E%EF%B8%8F-new-template.md&title=): Share a template you made based on NuxtHub.


## 💚 Contributing

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
```

## 📄 License

[Apache 2.0](./LICENSE)

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@nuxthub/core/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/@nuxthub/core

[npm-downloads-src]: https://img.shields.io/npm/dm/@nuxthub/core.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/@nuxthub/core

[license-src]: https://img.shields.io/npm/l/@nuxthub/core.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/@nuxthub/core

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
