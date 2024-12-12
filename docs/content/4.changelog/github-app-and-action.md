---
title: NuxtHub GitHub App & Action
description: "Introducing our GitHub App & Action for automating your Nuxt deployments with GitHub as well as a new project creation flow."
date: 2024-12-12
image: '/images/changelog/cloudflare-access.png'
authors:
  - name: Rihan Arfan
    avatar:
      src: https://avatars.githubusercontent.com/u/20425781?v=4
    to: https://bsky.app/profile/rihan.dev
    username: RihanArfan
---

We're thrilled to release our brand new [GitHub Application](https://github.com/apps/nuxthub-admin) & [GitHub Action](https://github.com/marketplace/actions/deploy-to-nuxthub) to help you create and deploy Nuxt applications to NuxtHub.

<!-- :nuxt-img{src="/images/changelog/cloudflare-access.png" alt="GitHub Action" width="915" height="515"} -->

## Features

**Pull Request Integration**: Automated comments on PRs with branch URLs, permalinks, and QR codes for easy preview access

:nuxt-img{src="/images/changelog/github-action-pr-comment.png" alt="NuxtHub GitHub Action pull request comment" width="810" height="760"}

**GitHub Deployments**: Full integration with GitHub's deployment system, including status updates and environment tracking

:nuxt-img{src="/images/changelog/github-action-deployment.jpeg" alt="NuxtHub GitHub Action deployments" width="1027" height="628"}

This includes GitHub Deployments support in pull requests.

:nuxt-img{src="/images/changelog/github-action-deployment-2.png" alt="NuxtHub GitHub Action pull request deployment" width="810" height="445"}

And many more:
- **Deployment Protection**: Support for GitHub's deployment protection rules which enable approval workflows and environment restrictions ([learn more on GitHub's documentation](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment#deployment-protection-rules))
- **Secure**: Our GitHub integration prevents the need for long-lived secrets as it uses OIDC under the hood
- **Customizable**: You can create tailored workflows to fit your DevOps requirements using our GitHub Action

## Migrating to GitHub Actions

Migrating from Cloudflare Pages CI or the legacy GitHub Action is simple and can be done from [NuxtHub Admin](https://admin.hub.nuxt.com/) → Project → Settings → Git.

<!-- img of migration alert -->

When migrating from Cloudflare Pages CI, please note:

- Deployment quotas will shift from [Pages CI limits](https://developers.cloudflare.com/pages/platform/limits/#builds) to your [GitHub Actions usage](https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions#included-storage-and-minutes)
- Environment variables and secrets needed at build time should be managed through [GitHub Environment settings](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables#creating-configuration-variables-for-an-environment)

::callout{to="/docs/getting-started/deploy#github-action" icon="i-lucide-book"}
Learn more about deploying with GitHub Actions to NuxtHub.
::

P.S. Give our new [GitHub Action](https://github.com/nuxt-hub/action) a star 🌟💚 
