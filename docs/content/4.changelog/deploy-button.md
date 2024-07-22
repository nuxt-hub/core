---
title: Deploy to NuxtHub button
description: "The Deploy to NuxtHub button allows you to deploy a GitHub template directly from the NuxtHub Admin."
date: 2024-07-22
image: '/images/changelog/deploy-button.png'
category: Template
authors:
  - name: Sebastien Chopin
    avatar: 
      src: https://avatars.githubusercontent.com/u/904724?v=4
    to: https://x.com/atinux
    username: atinux
  - name: Ahad Birang
    avatar: 
      src: https://avatars.githubusercontent.com/u/2047945?v=4
    to: https://x.com/a_birang
    username: a_birang
---

The button is designed to be used in the README of a GitHub repository, documentations or any other place where you want to allow users to deploy your project with one click.

:nuxt-img{src="/images/changelog/deploy-button.png" alt="NuxtHub Deploy Button" width="915" height="515"}

## Deploy Button

1. The image of the button is on `https://hub.nuxt.com/button.svg`
2. The link to deploy the project is `https://hub.nuxt.com/new?repo=ORG/REPO` (replace `ORG/REPO` with your GitHub repository)
3. Your repository must be public and marked as "Template repository" on GitHub

To use the button, you need to add the following markdown to your README:

::code-group

```md [Markdown]
[![Deploy to NuxtHub](https://hub.nuxt.com/button.svg)](https://hub.nuxt.com/new?repo=ORG/REPO)
```

```html [HTML]
<a href="https://hub.nuxt.com/new?repo=ORG/REPO"><img src="https://hub.nuxt.com/button.svg" alt="Deploy to NuxtHub"></a>
```

::

You can see an example of the button in action in the [Instadraw repository](https://github.com/atinux/instadraw).
