---
title: Hyperdrive bindings
description: "It is now possible to use PostgreSQL & Cloudflare Hyperdrive in your Nuxt application."
date: 2024-08-28
image: '/images/changelog/hyperdrive-bindings.png'
authors:
  - name: Sebastien Chopin
    avatar: 
      src: https://avatars.githubusercontent.com/u/904724?v=4
    to: https://x.com/atinux
    username: atinux
---

If you are not comfortable with Cloudflare D1 database (SQLite), you can now use your own PostgreSQL database.

We wrote a recipe on [How to use a PostgreSQL database](/docs/recipes/postgres) with NuxtHub.

This recipe explains how to connect to your PostgreSQL database and how to leverage Hyperdrive bindings in your Nuxt application to accelerate your database responses.

::callout
Right now, hyperdrive bindings are not available in development mode, we are working with the Cloudflare team to make them available in development mode as well with remote storage.
::

::tip
This feature is available on both [free and pro plans](/pricing) and in [`@nuxthub/core >= v0.7.6`](https://github.com/nuxt-hub/core/releases/tag/v0.7.6).
::
