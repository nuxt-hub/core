---
title: Cloudflare Access integration
description: "We now support Cloudflare Access within NuxtHub admin, module and CLI"
date: 2024-10-29
image: '/images/changelog/cloudflare-access.png'
authors:
  - name: Rihan Arfan
    avatar:
      src: https://avatars.githubusercontent.com/u/20425781?v=4
    to: https://x.com/RihanArfan
    username: RihanArfan
---

::tip
This feature is available on all [NuxtHub plans](/pricing) and comes with the [v0.8.4](https://github.com/nuxt-hub/core/releases/tag/v0.8.4) release of `@nuxthub/core`.
::

We now fully support Cloudflare Access across admin, module and CLI.

## What is Cloudflare Access

:nuxt-img{src="/images/changelog/cloudflare-access.png" alt="Cloudflare Access" width="915" height="515"}

[Cloudflare Access](https://www.cloudflare.com/zero-trust/products/access/) allows you to secure your web applications by restricting who can reach your application by applying configured identity-aware Access policies. Cloudflare Access is part of [Cloudflare's Zero Trust](https://www.cloudflare.com/plans/zero-trust-services/) offerings.

## What does this mean for NuxtHub

This enables you to create secure internal web applications on NuxtHub, without compromising on features like NuxtHub admin for management and remote storage during development.

::callout{to="/docs/recipes/cloudflare-access" icon="i-ph-book-open-duotone"}
Learn more about enabling Cloudflare Access with NuxtHub.
::
