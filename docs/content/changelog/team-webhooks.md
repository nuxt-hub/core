---
title: Team Webhooks
description: "It is now possible to trigger webhooks for your team's projects when a new deployment is created."
date: 2024-05-22
image: '/images/changelog/team-webhooks.png'
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

We are excited to announce that we have added a new feature to NuxtHub: **Team Webhooks**!

::tip
This feature is available on all [NuxtHub plans](/pricing).
::

## What are Team Webhooks?

They allow you to get notified about your project deployments. You can use them to trigger custom actions, like sending notifications to your team's chat, updating your project management tool and more.

:nuxt-img{src="/images/changelog/team-webhooks.png" alt="Team Webhooks" width="915" height="515"}

## Creating a Webhook

To create a webhook, go to your team settings and click on the "Webhooks" tab. You can then add a new webhook by providing an endpoint and selecting the events you want to trigger the webhook for.

:nuxt-img{src="/images/changelog/team-webhooks-new.png" alt="Creating a NuxtHub Webhook" width="915" height="515"}

## Slack & Discord Integration

We have also added built-in integrations for [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks) and [Discord Webhooks](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks).

When pasting a webhook URL from these services, we will automatically send a pre-formatted message to your channel or user.

:nuxt-img{src="/images/changelog/team-webhooks-slack.png" alt="NuxtHub Slack Integration" width="915" height="515"}

::callout{icon="i-lucide-heart"}
Thank you to [Israel Ortuno](https://github.com/IsraelOrtuno) for suggesting this feature on [nuxt-hub/core#102](https://github.com/nuxt-hub/core/issues/102).
::
