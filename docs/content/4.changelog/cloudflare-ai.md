---
title: Introducing hubAI()
description: "It is now possible to run machine learning models, such as LLMs in your NuxtHub application."
date: 2024-06-03
image: '/images/changelog/blob-folders.png'
category: Admin
authors:
  - name: Sebastien Chopin
    avatar: 
      src: https://avatars.githubusercontent.com/u/904724?v=4
    to: https://x.com/atinux
    username: atinux
  - name: Ahad Birang
    avatar: 
      src: https://avatars.githubusercontent.com/u/20425781?v=4
    to: https://x.com/RihanArfan
    username: RihanArfan
---

::tip
This feature is available on both [free and pro plans](/pricing).
::

We are excited to announce the introduction of `hubAI()` to NuxtHub. This new function allows you to run machine learning models, such as LLMs, directly within your NuxtHub application with minimal setup.

At NuxtHub, we care about DX and we want to make it easy for you to leverage AI in your application by leveraging Cloudflare AI without having to manage API keys, account ID or using the wrangler CLI.

## Pre-requisite

This change requires the `Worker AI` persmission to be enabled on your Cloudflare account.

- Open [Cloudflare User API Tokens](https://dash.cloudflare.com/profile/api-tokens)
- Find the NuxtHub token(s)
- Add the `Account > Worker AI > Read` permission
- Save the changes

::tip
This feature has been implemented in [nuxt-hub/core#173](https://github.com/nuxt-hub/core/pull/173).
::

