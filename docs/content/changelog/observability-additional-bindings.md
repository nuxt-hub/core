---
title: Worker Logs & Additional Bindings
description: "Support for Worker Logs and adding additional bindings for Worker projects."
date: 2025-04-18
image: '/images/changelog/observability-additional-bindings.png'
category: Core
authors:
  - name: Rihan Arfan
    avatar:
      src: https://avatars.githubusercontent.com/u/20425781?v=4
    to: https://bsky.app/profile/rihan.dev
    username: rihan.dev
---

::tip
This feature is available from [`@nuxthub/core >= v0.9.1`](https://github.com/nuxt-hub/core/releases/tag/v0.9.1).
::

Worker projects on NuxtHub can now enable Worker Logs, and associate additional bindings to deployments all from within the NuxtHub config. This opens the possibility of adding additional [databases](https://developers.cloudflare.com/d1/worker-api/), [R2 buckets](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/), [service bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/), [rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/), [queues](https://developers.cloudflare.com/queues/configuration/javascript-apis/) and [more](https://developers.cloudflare.com/workers/runtime-apis/bindings/) to projects.

## Worker Logs

Workers Logs lets you automatically collect, store, filter, and analyze logging data emitted from your Nuxt app. Currently, you can query it in the dashboard for each of your Workers projects within the Cloudflare Dashboard.

Logs include [invocation logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/#invocation-logs), [custom logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/#custom-logs), errors, and uncaught exceptions.

### Usage

Enable Worker Logs within `hub.bindings.observability.logs` in your `nuxt.config.ts`.

::field-group
  ::field{name="observability" type="string" required}
    Observability settings


    ::collapsible

    ::field{name="logs" type="boolean | object"}
      Enable Worker Logs with default configuration.<br><br>

      Defaults to `head_sampling_rate: 1` and `invocation_logs: true`
    ::

    ::field{name="logs" type="boolean | object"}
      Worker Logs configuration

      ::collapsible
        ::field{name="head_sampling_rate" type="number"}
          Head-based sampling allows you to log a percentage of incoming requests to your Nuxt app. Especially for high-traffic applications, this helps reduce log volume and manage costs, while still providing meaningful insights into your application's performance. When you configure a head-based sampling rate, you can control the percentage of requests that get logged. All logs within the context of the request are collected.<br><br>

          To enable head-based sampling, set `head_sampling_rate` within the observability configuration. The valid range is from 0 to 1, where 0 indicates zero out of one hundred requests are logged, and 1 indicates every request is logged. If `head_sampling_rate` is unspecified, it is configured to a default value of 1 (100%). In the example below, `head_sampling_rate` is set to 0.01, which means one out of every one hundred requests is logged.
        ::

        ::field{name="invocation_logs" type="boolean?"}
          Each Workers invocation returns a single invocation log that contains details such as the Request, Response, and related metadata. These invocation logs can be identified by the field $cloudflare.$metadata.type = "cf-worker-event". Each invocation log is enriched with information available to Cloudflare in the context of the invocation.<br><br>

          In the Workers Logs UI, logs are presented with a localized timestamp and a message. The message is dependent on the invocation handler. For example, Fetch requests will have a message describing the request method and the request URL, while cron events will be listed as cron. Below is a list of invocation handlers along with their invocation message.
        ::
      ::
    ::
    ::
  ::
::

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

## Custom bindings

Custom bindings can be configured within `hub.bindings` in your `nuxt.config.ts`. All options are suggested via IntelliSense, however, you can refer to Cloudflare's API documentation.

### Disallowed bindings
Some bindings types cannot be added for certain features already handled by NuxtHub that do not have additional options, or already support multiple bindings.

- `ai` → [`hub.ai`](/docs/features/ai)
- `assets` → [`hub.workers`](/changelog/workers)
- `browser_rendering` → [`hub.browser`](/docs/features/browser)
- `vectorize` → [`hub.vectorize`](/docs/features/vectorize)

::note
Additional bindings are not provisioned automatically like they are with NuxtHub features such as `hub.database`. You will need to create the resources manually from the Cloudflare dashboard.
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
