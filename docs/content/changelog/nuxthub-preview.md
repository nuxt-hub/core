---
title: "`nuxthub preview` command"
description: "We added a new command to preview your production build locally with `wrangler`."
date: 2024-09-16
image: '/images/changelog/nuxthub-preview.png'
authors:
  - name: Sebastien Chopin
    avatar: 
      src: https://avatars.githubusercontent.com/u/904724?v=4
    to: https://x.com/atinux
    username: atinux
---

As developers working with Cloudflare Workers and edge runtimes, we've long grappled with the challenges of accurately previewing our production builds locally. The edge runtime environment differs significantly from Node.js, which is why Cloudflare introduced the `wrangler pages dev` command.

However, as NuxtHub doesn't rely on a `wrangler.toml` file, this solution wasn't quite perfect.

Today, I'm excited to introduce the `nuxthub preview` command. This new addition to our CLI bridges the gap between local development and edge runtime environments, making it easier than ever to test and refine your NuxtHub projects before deployment.

## Usage

With the latest release of the `nuxthub` CLI (v0.6.0), you can now preview your production build locally with a new command.

```bash [Terminal]
# 1/ Build your application for production
npx nuxt build
# 2/ Preview your production build locally
npx nuxthub preview
```

This command will:
1. read the `dist/hub.config.json` file and generate a local `dist/wrangler.toml` file
2. start the server using the `wrangler pages dev` command within the `dist/` director

:nuxt-img{src="/images/changelog/nuxthub-preview.png" alt="NuxtHub Preview command" width="915" height="515"}

## Limitations

At the moment, the `nuxthub preview` command has the following limitations:

- It does not work with the `--remote` flag (only local bindings)
- [`hubAI()`](/docs/features/ai) will ask you connect within the terminal with wrangler
- [`hubBrowser()`](/docs/features/browser) is not supported as not supported by `wrangler pages dev`

## Open Source

The CLI is full open source on GitHub, feel free to contribute and improve it.

::callout{to="https://github.com/nuxt-hub/cli" target="_blank" icon="i-simple-icons-github"}
Checkout the `nuxthub` CLI on GitHub.
::
