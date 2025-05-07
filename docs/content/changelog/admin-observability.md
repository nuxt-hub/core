---
title: Worker Logs on NuxtHub Admin
description: Worker logs are now available on NuxtHub Admin, allowing you to filter and analyze historical logs from your deployed Nuxt App.
date: 2025-05-07
image: '/images/changelog/nuxthub-workers-admin-observability.png'
authors:
  - name: Sebastien Chopin
    avatar:
      src: https://avatars.githubusercontent.com/u/904724?v=4
    to: https://bsky.app/profile/atinux.com
    username: atinux
  - name: Rihan Arfan
    avatar:
      src: https://avatars.githubusercontent.com/u/20425781?v=4
    to: https://bsky.app/profile/rihan.dev
    username: rihan.dev
  - name: Ahad Birang
    avatar:
      src: https://avatars.githubusercontent.com/u/2047945?v=4
    to: https://bsky.app/profile/farnabaz.dev
    username: farnabaz.dev
---

::tip
Worker logs are available from [`@nuxthub/core >= v0.8.25`](https://github.com/nuxt-hub/core/releases/tag/v0.8.25), it is suggested to use the latest version. In the latest version, Worker Logs are enabled by default.
::

It is now possible to view, filter and analyze worker logs within the NuxtHub Admin.

The logs page are refactored to be more user-friendly and easier to use. The new UI is easier to read and allows you to view the whole log message. This new logs page is available for both Pages and Workers.

![Worker logs](/images/changelog/worker-logs-admin.png)


## Enable Worker Logs

Worker logs are enabled by default in the latest version of NuxtHub core module (`@nuxthub/core >= v0.8.27`).

If you are using older versions, you can enable Worker Logs by setting `hub.bindings.observability.logs` to `true` in your `nuxt.config.ts`.

```ts
export default defineNuxtConfig({
  hub: {
    bindings: {
      observability: {
        logs: true,
      },
    },
  },
});
```

::callout{to="/changelog/observability-additional-bindings" icon="i-lucide-book"}
Learn more about enabling Worker Logs and additional bindings.
::