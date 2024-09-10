---
title: Browser Rendering
navigation.title: Browser
description: Control and interact with a headless browser instance in your Nuxt application using Puppeteer.
---

## Getting Started

Enable browser rendering in your Nuxt project by enabling the `hub.browser` option:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    browser: true
  },
})
```

Lastly, install the required dependencies by running the following command:

```bash [Terminal]
npx ni @cloudflare/puppeteer puppeteer
```

::note
[ni](https://github.com/antfu/ni) will automatically detect the package manager you are using and install the dependencies.
::

## Usage

In your server API routes, you can use the `hubBrowser` function to get a [Puppeteer browser instance](https://github.com/puppeteer/puppeteer):

```ts
const { page, browser } = await hubBrowser()
```

In production, the instance will be from [`@cloudflare/puppeteer`](https://developers.cloudflare.com/browser-rendering/platform/puppeteer/) which is a fork of Puppeteer with version specialized for working within Cloudflare workers.

::tip
NuxtHub will automatically close the `page` instance when the response is sent as well as closing or disconnecting the `browser` instance when needed.
::

## Use Cases

Here are some use cases for using a headless browser like Puppeteer in your Nuxt application:
- **Web scraping:** Extract data from websites, especially those with dynamic content that requires JavaScript execution.
- **Generating PDFs or screenshots:** Create snapshots or PDF versions of web pages.
- **Performance monitoring:** Measure load times, resource usage, and other performance metrics of web applications.
- **Automating interactions or testing:** Simulating user actions on websites for tasks like form filling, clicking buttons, or navigating through multi-step processes.

## Limits

::important
Browser rendering is only available on the [Workers Paid](https://www.cloudflare.com/plans/developer-platform/) plan for now.
::

To improve the performance in production, NuxtHub will reuse browser sessions. This means that the browser will stay open after each request (for 60 seconds), a new request will reuse the same browser session if available or open a new one.

The Cloudflare limits are:
- 2 new browsers per minute per Cloudflare account
- 2 concurrent browser sessions per account
- a browser instance gets killed if no activity is detected for 60 seconds (idle timeout)

You can extend the idle timeout by giving the `keepAlive` option when creating the browser instance:

```ts
// keep the browser instance alive for 120 seconds
const { page, browser } = await hubBrowser({ keepAlive: 120 })
```

The maximum idle timeout is 600 seconds (10 minutes).

::tip
Once NuxtHub supports [Durable Objects](https://github.com/nuxt-hub/core/issues/50), you will be able to create a single browser instance that will stay open for a long time, and you will be able to reuse it across requests.
::

## Screenshot Capture

Taking a screenshot of a website is a common use case for a headless browser. Let's create an API route to capture a screenshot of a website:

```ts [server/api/screenshot.ts]
import { z } from 'zod'

export default eventHandler(async (event) => {
  // Get the URL and theme from the query parameters
  const { url, theme } = await getValidatedQuery(event, z.object({
    url: z.string().url(),
    theme: z.enum(['light', 'dark']).optional().default('light')
  }).parse)

  // Get a browser session and open a new page
  const { page } = await hubBrowser()

  // Set the viewport to full HD & set the color-scheme
  await page.setViewport({ width: 1920, height: 1080 })
  await page.emulateMediaFeatures([{
    name: 'prefers-color-scheme',
    value: theme
  }])

  // Go to the URL and wait for the page to load
  await page.goto(url, { waitUntil: 'domcontentloaded' })

  // Return the screenshot as response
  setHeader(event, 'content-type', 'image/jpeg')
  return page.screenshot()
})
```

On the application side, we can create a simple form to call our API endpoint:

```vue [pages/capture.vue]
<script setup>
const url = ref('https://hub.nuxt.com')
const image = ref('')
const theme = ref('light')
const loading = ref(false)

async function capture {
  if (loading.value) return
  loading.value = true
  const blob = await $fetch('/api/browser/capture', {
    query: {
      url: url.value,
      theme: theme.value
    }
  })
  image.value = URL.createObjectURL(blob)
  loading.value = false
}
</script>

<template>
  <form @submit.prevent="capture">
    <input v-model="url" type="url" />
    <select v-model="theme">
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
    <button type="submit" :disabled="loading">
      {{ loading ? 'Capturing...' : 'Capture' }}
    </button>
    <img v-if="image && !loading" :src="image" style="aspect-ratio: 16/9;" />
  </form>
</template>
```

That's it! You can now capture screenshots of websites using Puppeteer in your Nuxt application.

### Storing the screenshots

You can store the screenshots in the Blob storage:

```ts
const screenshot = await page.screenshot()

// Upload the screenshot to the Blob storage
const filename = `screenshots/${url.value.replace(/[^a-zA-Z0-9]/g, '-')}.jpg`
const blob = await hubBlob().put(filename, screenshot)
```

::note{to="/docs/features/blob"}
Learn more about the Blob storage.
::

## Metadata Extraction

Another common use case is to extract metadata from a website.

```ts [server/api/metadata.ts]
import { z } from 'zod'

export default eventHandler(async (event) => {
  // Get the URL from the query parameters
  const { url } = await getValidatedQuery(event, z.object({
    url: z.string().url()
  }).parse)

  // Get a browser instance and navigate to the url
  const { page } = await hubBrowser()
  await page.goto(url, { waitUntil: 'networkidle0' })

  // Extract metadata from the page
  const metadata = await page.evaluate(() => {
    const getMetaContent = (name) => {
      const element = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)
      return element ? element.getAttribute('content') : null
    }

    return {
      title: document.title,
      description: getMetaContent('description') || getMetaContent('og:description'),
      favicon: document.querySelector('link[rel="shortcut icon"]')?.href
      || document.querySelector('link[rel="icon"]')?.href,
      ogImage: getMetaContent('og:image'),
      origin: document.location.origin
    }
  })

  return metadata
})
```

Visiting `/api/metadata?url=https://cloudflare.com` will return the metadata of the website:

```json
{
  "title": "Connect, Protect and Build Everywhere | Cloudflare",
  "description": "Make employees, applications and networks faster and more secure everywhere, while reducing complexity and cost.",
  "favicon": "https://www.cloudflare.com/favicon.ico",
  "ogImage": "https://cf-assets.www.cloudflare.com/slt3lc6tev37/2FNnxFZOBEha1W2MhF44EN/e9438de558c983ccce8129ddc20e1b8b/CF_MetaImage_1200x628.png",
  "origin": "https://www.cloudflare.com"
}
```

To store the metadata of a website, you can use the [Key Value Storage](/docs/features/kv).

Or directly leverage [Caching](/docs/features/cache) on this API route:

```ts [server/api/metadata.ts]
export default cachedEventHandler(async (event) => {
  // ...
}, {
  maxAge: 60 * 60 * 24 * 7, // 1 week
  swr: true,
  // Use the URL as key to invalidate the cache when the URL changes
  // We use btoa to transform the URL to a base64 string
  getKey: (event) => btoa(getQuery(event).url),
})
```

## PDF Generation

You can also generate PDF using `hubBrowser()`, this is useful if you want to generate an invoice or a receipt for example.

Let's create a `/_invoice` page with Vue that we will use as template to generate a PDF:

```vue [pages/_invoice.vue]
<script setup>
definePageMeta({
  layout: 'blank'
})

// TODO: Fetch data from API instead of hardcoding
const currentDate = ref(new Date().toLocaleDateString())
const items = ref([
  { name: 'Item 1', quantity: 2, price: 10.00 },
  { name: 'Item 2', quantity: 1, price: 15.00 },
  { name: 'Item 3', quantity: 3, price: 7.50 }
])
const total = computed(() => {
  return items.value.reduce((sum, item) => sum + item.quantity * item.price, 0)
})
</script>

<template>
  <div style="font-family: Arial, sans-serif; padding: 20px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
      <div>
        <p><strong>Invoice To:</strong></p>
        <p>John Doe</p>
        <p>123 Main St</p>
        <p>Anytown, USA 12345</p>
      </div>
      <div>
        <p><strong>Invoice Number:</strong> INV-001</p>
        <p><strong>Date:</strong> {{ currentDate }}</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in items" :key="index">
          <td>{{ item.name }}</td>
          <td>{{ item.quantity }}</td>
          <td>${{ item.price.toFixed(2) }}</td>
          <td>${{ (item.quantity * item.price).toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>
    <div style="text-align: right; margin-top: 20px;">
      <p><strong>Total: ${{ total.toFixed(2) }}</strong></p>
    </div>
  </div>
</template>

<style scoped>
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
th { background-color: #f2f2f2; }
</style>
```

To avoid having any styling issues, we recommend to keep your `app.vue` as minimal as possible:

```vue [app.vue]
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

And move most of your head management, style & HTML structure in [`layouts/default.vue`](https://nuxt.com/docs/guide/directory-structure/layouts#default-layout).

Lastly, we need to create a `layouts/blank.vue` to avoid having any layout on our `_invoice` page:

```vue [layouts/blank.vue]
<template>
  <slot />
</template>
```

This will ensure that no header, footer or any other layout elements are rendered.

Now, let's create our server route to generate the PDF:

```ts [server/routes/invoice.pdf.ts]
export default eventHandler(async (event) => {
  const { page } = await hubBrowser()
  await page.goto(`${getRequestURL(event).origin}/_invoice`)

  setHeader(event, 'Content-Type', 'application/pdf')
  return page.pdf({ format: 'A4' })
})
```

You can now display links to download or open the PDF in your pages:

```vue [pages/index.vue]
<template>
  <a href="/invoice.pdf" download>Download PDF</a>
  <a href="/invoice.pdf">Open PDF</a>
</template>
```
