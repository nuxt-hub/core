---
title: Additional features
navigation.title: Additional
description: Add additional Cloudflare resource bindings to deployments
---

Cloudflare offer additional resources that aren't directly supported in NuxtHub yet. You can add bindings to associate these resources to your NuxtHub project. Custom bindings can be configured within `hub.bindings` in your `nuxt.config.ts`.

Additional bindings are not provisioned automatically like they are with NuxtHub features such as [`hub.database`](/features/database). You will need to create the resources manually from the Cloudflare dashboard or [wrangler](https://developers.cloudflare.com/workers/wrangler/commands/).

You can add additional bindings to:
- Add additional [D1 databases](https://developers.cloudflare.com/d1/worker-api/), [R2 buckets](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/) (blob), [KV namespaces](https://developers.cloudflare.com/kv/api/) & [analytics datasets](https://developers.cloudflare.com/analytics/analytics-engine/get-started/#2-write-data-points-from-your-worker)
- or use [service bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/), [rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/), [queues](https://developers.cloudflare.com/queues/configuration/javascript-apis/), and more

::callout{to="https://developers.cloudflare.com/workers/runtime-apis/bindings/" icon="i-lucide-book"}
View all available binding types on the Cloudflare documentation.
::

## Configuration

Properties on `hub.bindings`

::field-group
  ::field{name="compatibilityDate" type="string"}
    Set a custom compatibility date.
    <br>Learn more on [Cloudflare's documentation](https://developers.cloudflare.com/workers/configuration/compatibility-dates/).
  ::

  ::field{name="compatibilityFlags" type="string" default="node_compat"}
    Set additional compatibility flags, separated with a `space`.
    <br>Learn more on [Cloudflare's documentation](https://developers.cloudflare.com/workers/configuration/compatibility-flags/).<br><br>

    The [`nodejs_compat`](https://developers.cloudflare.com/workers/configuration/compatibility-flags/#nodejs-compatibility-flag) flag is always enabled.
  ::

  ::field{name="observability"}
    Observability configurations. View all options on the [observability docs](/docs/getting-started/server-logs#cloudflare-dashboard).
  ::

  ::field{name="hyperdrive" type="object"}
    Hyperdrive configuration.

    > ::field{name="<BINDING NAME>" type="string"}
    >   Binding name and Hyperdrive ID.
    > ::
  ::

  ::field{name="<additional binding type>" type="object"}
    Refer to [Cloudflare's API documentation](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/versions/methods/create/#(params)%200%20%3E%20(param)%20metadata%20%3E%20(schema)%20%3E%20(property)%20bindings) to see a list of binding type names under `Body parameters` → `metadata` → `bindings`.


    > ::field{name="<BINDING NAME>" type="object"}
    >   Binding options (excluding properties `name` and `type`)
    > ::
  ::
::

::note
Additional bindings are only available within Worker project types.
::

## Example

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


## Disallowed bindings
Some bindings types cannot be added for certain features already handled by NuxtHub that do not have additional options, or already support multiple bindings. Refer to the table below.

- `ai` → [`hub.ai`](/docs/features/ai)
- `assets` → [`hub.workers`](/changelog/workers)
- `browser_rendering` → [`hub.browser`](/docs/features/browser)
- `vectorize` → [`hub.vectorize`](/docs/features/vectorize)
