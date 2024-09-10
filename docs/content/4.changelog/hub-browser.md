---
title: Introducing hubBrowser()
description: "Taking screenshots, crawling websites, generating PDFs and more has never been easier with `hubBrowser()`."
date: 2024-09-09
image: '/images/changelog/nuxthub-browser.jpg'
authors:
  - name: Sebastien Chopin
    avatar: 
      src: https://avatars.githubusercontent.com/u/904724?v=4
    to: https://x.com/atinux
    username: atinux
---

::tip
This feature is available on both [free and pro plans](/pricing) of NuxtHub but on the [Workers Paid plan](https://www.cloudflare.com/plans/developer-platform/) for your Cloudflare account.
::

We are excited to introduce [`hubBrowser()`](/docs/features/browser). This new method allows you to run a headless browser directly in your Nuxt application using [Puppeteer](https://github.com/puppeteer/puppeteer).

::video{poster="https://res.cloudinary.com/nuxt/video/upload/v1725901706/nuxthub/nuxthub-browser_dsn1m1.jpg" controls class="w-full h-auto rounded"}
  :source{src="https://res.cloudinary.com/nuxt/video/upload/v1725901706/nuxthub/nuxthub-browser_dsn1m1.webm" type="video/webm"}
  :source{src="https://res.cloudinary.com/nuxt/video/upload/v1725901706/nuxthub/nuxthub-browser_dsn1m1.mov" type="video/mp4"}
  :source{src="https://res.cloudinary.com/nuxt/video/upload/v1725901706/nuxthub/nuxthub-browser_dsn1m1.ogg" type="video/ogg"}
::

## How to use hubBrowser()

1. Update `@nuxthub/core` to the latest version (`v0.7.11` or later)

2. Enable `hub.browser` in your `nuxt.config.ts`

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    browser: true
  }
})
```

3. Install the required dependencies

```bash [Terminal]
npx ni @cloudflare/puppeteer puppeteer
```

4. Start using [`hubBrowser()`](/docs/features/browser) in your server routes

```ts [server/api/screenshot.ts]
export default eventHandler(async (event) => {
  const { page } = await hubBrowser()
  
  await page.setViewport({ width: 1920, height: 1080 })
  await page.goto('https://cloudflare.com')
  
  setHeader(event, 'content-type', 'image/jpeg')
  return page.screenshot()
})
```

5. Before deploying, make sure you are subscribed to the [Workers Paid plan](https://www.cloudflare.com/plans/developer-platform/)

6. [Deploy your project with NuxtHub](/docs/getting-started/deploy)

::note{to="/docs/features/browser"}
Read the documentation about `hubBrowser()` with more examples.
::
