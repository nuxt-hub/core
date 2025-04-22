---
title: Worker Logs & Additional Bindings
description: "Support for Worker Logs and adding additional bindings for Worker projects."
date: 2025-04-18
image: '/images/changelog/nuxthub-workers-observability.png'
category: Core
authors:
  - name: Rihan Arfan
    avatar:
      src: https://avatars.githubusercontent.com/u/20425781?v=4
    to: https://bsky.app/profile/rihan.dev
    username: rihan.dev
---

::tip
This feature is available from [`@nuxthub/core >= v0.8.25`](https://github.com/nuxt-hub/core/releases/tag/v0.8.25)
::

Worker projects on NuxtHub can now enable Worker Logs, and associate additional bindings to deployments all from within the NuxtHub config. This opens the possibility of adding additional [databases](https://developers.cloudflare.com/d1/worker-api/), [R2 buckets](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/), [service bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/), [rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/), [queues](https://developers.cloudflare.com/queues/configuration/javascript-apis/) and [more](https://developers.cloudflare.com/workers/runtime-apis/bindings/) to projects.

## Worker Logs

Workers Logs lets you automatically collect, store, filter, and analyze logging data emitted from your Nuxt app. Currently, you can query it in the dashboard for each of your Workers projects within the Cloudflare Dashboard.

Logs include [invocation logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/#invocation-logs), [custom logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/#custom-logs), errors, and uncaught exceptions.

::callout{to="/docs/getting-started/server-logs#cloudflare-dashboard" icon="i-lucide-book"}
Learn more about enabling Worker Logs.
::

![Observability Overview](/images/docs/observability-overview.png)

Enable Worker Logs within `hub.bindings.observability.logs` in your `nuxt.config.ts`.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    bindings: {
      observability: {
        // enable with default settings
        logs: true,

        // customise settings
        logs: {
          head_sampling_rate: 0.5,
          invocation_logs: false
        }
      }
    }
  },
```

## Additional bindings

Additional bindings can be configured within `hub.bindings` in your `nuxt.config.ts`. All options are suggested via IntelliSense, however, you can refer to [Cloudflare's API documentation](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/versions/methods/create/#(params)%200%20%3E%20(param)%20metadata%20%3E%20(schema)%20%3E%20(property)%20bindings) too.

Resources for additional bindings are not provisioned automatically like they are with NuxtHub features such as `hub.database`. You will need to create the resources manually from the Cloudflare dashboard.

::callout{to="/docs/features/additional-bindings" icon="i-lucide-book"}
Learn more about assigning additional bindings.
::

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    bindings: {
      // <binding type>: {
      //   <BINDING NAME>: {
      //     // binding options
      //   }
      // }

      // additional cloudflare bindings
      analytics_engine: {
        ANALYTICS_TESTING: {
          dataset: 'testing'
        }
      },
      mtls_certificate: {
        CERT: {
          certificate_id: '<CERTIFICATE_ID>'
        }
      }
    }
  },
```
