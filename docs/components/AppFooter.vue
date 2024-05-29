<script setup lang="ts">
const links = [
  {
    label: 'Nuxt Docs',
    to: 'https://nuxt.com'
  }, {
    label: 'Terms',
    to: 'https://admin.hub.nuxt.com/terms',
    target: '_blank'
  }, {
    label: 'Privacy',
    to: 'https://admin.hub.nuxt.com/privacy',
    target: '_blank'
  }
]
</script>

<template>
  <UFooter :links="links">
    <template #left>
      <span class="inline text-sm">© {{ new Date().getFullYear() }} <a href="https://nuxtlabs.com" target="_blank" class="text-gray-900 dark:text-gray-50 hover:underline underline-offset-4">NuxtLabs</a></span>
    </template>

    <template #right>
      <UColorModeButton />
      <UButton
        icon="i-simple-icons-x"
        color="gray"
        variant="ghost"
        to="https://x.com/nuxt_hub"
        target="_blank"
        aria-label="Go to NuxtHub X account"
      />
      <UButton
        icon="i-simple-icons-github"
        color="gray"
        variant="ghost"
        to="https://github.com/nuxt-hub/core"
        target="_blank"
        aria-label="Go to NuxtHub GitHub repository"
      />
    </template>
  </UFooter>
</template>
