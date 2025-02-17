<script setup lang="ts">
const links = [
  {
    label: 'Terms',
    to: 'https://admin.hub.nuxt.com/terms',
    target: '_blank'
  }, {
    label: 'Privacy',
    to: 'https://admin.hub.nuxt.com/privacy',
    target: '_blank'
  }, {
    label: 'Status',
    to: 'https://status.hub.nuxt.com',
    target: '_blank'
  }
]
</script>

<template>
  <UFooter>
    <template #left>
      <span class="inline text-sm">© {{ new Date().getFullYear() }} <a href="https://nuxtlabs.com" target="_blank" class="text-gray-900 dark:text-gray-50 hover:underline underline-offset-4">NuxtLabs</a></span>
    </template>

    <UNavigationMenu :items="links" variant="link" />

    <template #right>
      <ColorScheme><UColorModeSelect size="sm" variant="ghost" /></ColorScheme>
      <UButton
        icon="i-simple-icons-discord"
        color="neutral"
        variant="ghost"
        to="https://discord.gg/vW89dsVqBF"
        target="_blank"
        aria-label="Go to NuxtHub Discord server"
        size="sm"
      />
      <UButton
        icon="i-simple-icons-x"
        color="neutral"
        variant="ghost"
        to="https://x.com/nuxt_hub"
        target="_blank"
        aria-label="Go to NuxtHub X account"
        size="sm"
      />
      <UButton
        icon="i-simple-icons-linkedin"
        color="neutral"
        variant="ghost"
        to="https://www.linkedin.com/showcase/nuxthub/"
        target="_blank"
        aria-label="Go to NuxtHub LinkedIn page"
        size="sm"
      />
      <UButton
        icon="i-simple-icons-github"
        color="neutral"
        variant="ghost"
        to="https://github.com/nuxt-hub/core"
        target="_blank"
        aria-label="Go to NuxtHub GitHub repository"
        size="sm"
      />
    </template>
  </UFooter>
</template>
