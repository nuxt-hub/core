---
title: Environments & Improved variables management
description: "Create additional deployment environments & revamped environment variable management"
date: 2025-06-06
image: '/images/changelog/workers-support.png'
authors:
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
This feature is available on both [free and pro plans](/pricing) and in [`@nuxthub/core >= v0.9.0`](https://github.com/nuxt-hub/core/releases/tag/v0.9.0).
::

We've been working hard on closing the gap between Pages and Workers, and improving the experience using NuxtHub. With this release, we've brought preview environments to Workers, and improved environment variables management.

## Environments

When we first introduced Cloudflare Workers support in NuxtHub, we only supported production deployments. Today, we're excited to announce that Workers now has the same powerful environment capabilities as Pages, making it easier than ever to test and deploy your applications. Any deployment from a non-production branch automatically gets deployed to the preview environment with separate resources (database, kv, etc.) than production.

::note
Due to Cloudflare limitations, deployments with the `cloudflare_durable` preset will not receive a unique deployment URL.
::

### Custom Environments

We're taking things a step further and introducing the ability to create additional environments beyond just preview and production, such as staging, testing, etc. All environments in NuxtHub have unique resources, making them perfect for testing. NuxtHub allows configuring the branch patterns on custom environments with exact, prefix and suffix, to enable different workflows.
  - Example: The branch `staging` deploys to the staging environment
  - Example: All branches starting with `bugfix/` deploys to a testing environment

Get started from the new "Environments" page of NuxtHub Admin.


## Revamped environment variables management

The biggest challenge faced by users since introducing the NuxtHub GitHub Action as the primary method for deployment was syncing environment variables and secrets to GitHub. Our syncing relied on [environments in GitHub](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment), which is a paid feature, therefore many NuxtHub users had to manually set environment variables to GitHub. Furthermore, GitHub Actions required specifying every secret used within the workflow which meant there was friction when using secrets, such as `NUXT_UI_PRO_LICENSE`.

We've worked hard to resolve this hurdle and to streamline the experience using NuxtHub. Now we're thrilled to introduce [`nuxt-hub/action@v2`](https://github.com/nuxt-hub/action), which now securely pulls environment variables and secrets from NuxtHub Admin, and builds your Nuxt application. On top of this, you can now scope environment variables to be build or runtime only, allowing you to further protect secrets.

### Migration guide

In order to use the new system, follow our migration guide:

1. Update to [`@nuxthub/core >= v0.9.0`](https://github.com/nuxt-hub/core/releases/tag/v0.9.0) on production and preview
2. Go to Environment Variables within the NuxtHub Admin
3. Click "Migrate environment variables"

#### Migrating to NuxtHub Action v2

1. Remove the `environments:` section
2. Remove the `Build application` section
3. Upgrade from `nuxt-hub/action@v1` to `nuxt-hub/action@v2`

See the updated GitHub Action workflow below:
```diff
name: Deploy to NuxtHub
on: push

jobs:
  deploy:
    name: "Deploy to NuxtHub"
    runs-on: ubuntu-latest
-    environment:
-      name: ${{ github.ref == 'refs/heads/main' && 'production' || 'preview' }}
-      url: ${{ steps.deploy.outputs.deployment-url }}
    permissions:
      contents: read
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v4

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

-      - name: Ensure NuxtHub module is installed
-        run: pnpx nuxthub@latest ensure
-
-      - name: Build application
-        run: pnpm build

-      - name: Deploy to NuxtHub
-        uses: nuxt-hub/action@v1
-        id: deploy
-        with:
-          project-key: <YOUR-PROJECT-KEY>

+      - name: Build & Deploy to NuxtHub
+        uses: nuxt-hub/action@v2
+        with:
+          project-key: <YOUR-PROJECT-KEY>
```

4. If your Nuxt app is not within the repository root and `directory:` parameter is provided, remove the trailing `/dist`.
```diff
-      - name: Deploy to NuxtHub
-        uses: nuxt-hub/action@v1
-        with:
-          directory: frontend/dist

+      - name: Build & Deploy to NuxtHub
+        uses: nuxt-hub/action@v2
+        with:
+          directory: frontend
```

This release marks a significant milestone in our journey to provide a seamless deployment experience across both Pages and Workers. The introduction of preview environments and improved environment variables management brings feature parity between the two platforms, making it easier than ever to deploy and test your Nuxt applications. We're excited to see how you'll use these new capabilities to streamline your development workflow.
