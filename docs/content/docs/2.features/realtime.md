---
title: Realtime & WebSockets
navigation.title: Realtime
description: Build realtime experiences with NuxtHub using Cloudflare Workers & Durable Objects.
---

## Getting Started

Enable [Niro's experimental WebSocket](https://nitro.build/guide/websocket) support by adding the following to your `nuxt.config.ts` file:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  nitro: {
    experimental: {
      websocket: true
    }
  },
  hub: {
    workers: true
  }
})
```

::note
We need to enable the `workers` option to use the WebSocket support as Durable Objects are only supported on Cloudflare Workers.
::

## Example

Let's create a simple application that display how many users are connected to the website.

First, let's create a websocket handler on `/ws/visitors` route:

```ts [server/routes/ws/visitors.ts]
export default defineWebSocketHandler({
  open(peer) {
    // We subscribe to the 'visitors' channel
    peer.subscribe('visitors')
    // We publish the number of connected users to the 'visitors' channel
    peer.publish('visitors', peer.peers.size)
    // We send the number of connected users to the client
    peer.send(peer.peers.size)
  },
  close(peer) {
    peer.unsubscribe('visitors')
    // Wait 500ms before sending the updated locations to the server
    setTimeout(() => {
      peer.publish('visitors', peer.peers.size)
    }, 500)
  },
})
```

Install VueUse if you haven't already:

```bash [Terminal]
npx nuxi module add vueuse
```

Let's use the [`useWebSocket`](https://vueuse.org/core/useWebSocket/) composable from VueUse to subscribe to the `visitors` channel and display the number of connected users.

```vue [pages/visitors.vue]
<script setup lang="ts">
const visitors = ref(0)
const { open } = useWebSocket('/ws/visitors', {
  immediate: false,
  async onMessage(ws, event) {
    // We parse the number of connected users from the message
    // The message might be a string or a Blob
    visitors.value = parseInt(typeof event.data === 'string' ? event.data : await event.data.text())
  },
})

// We open the connection when the component is mounted
onMounted(() => {
  open()
})
</script>

<template>
  <div>
    <h1>Visitors: {{ visitors }}</h1>
  </div>
</template>
```

See a full open source example on [GitHub](https://github.com/nuxt-hub/multiplayer-globe), including geolocation tracking.