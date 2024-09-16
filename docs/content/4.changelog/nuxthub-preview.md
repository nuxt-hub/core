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

## Preview your production build locally

With the latest release of the `nuxthub` CLI, you can now preview your production build locally with a new command.

```bash [Terminal]
# Build your application for production
npx nuxt buikd
# Preview your production build locally
npx nuxthub preview
```

This command will read your NuxtHub config and generate a local `wrangler.toml` file, then start the server using the `wrangler pages dev` command, serving your production build, allowing you to preview your project as if you were on the Edge runtime.

:nuxt-img{src="/images/changelog/nuxthub-preview.png" alt="NuxtHub Preview command" width="915" height="515"}

::callout{to="https://github.com/nuxt-hub/cli" target="_blank" icon="i-simple-icons-github" color="gray"}
Learn more about the `nuxthub` CLI.
::
