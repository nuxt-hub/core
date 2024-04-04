<script setup lang="ts">
const { footer } = useAppConfig()

const links = [
  {
    label: 'Get Started',
    to: '/docs/getting-started'
  },
  {
    label: 'Database',
    to: '/docs/storage/database'
  },
  {
    label: 'KV',
    to: '/docs/storage/kv'
  },
  {
    label: 'Blob',
    to: '/docs/storage/blob'
  },
  {
    label: 'Admin',
    to: 'https://admin.hub.nuxt.com',
    target: '_blank'
  }
]
</script>

<template>
  <UFooter :links="links">
    <template #left>
      <span class="inline">Made by <a href="https://nuxtlabs.com" target="_blank" class="text-gray-900 dark:text-gray-50 hover:underline underline-offset-2 font-medium">NuxtLabs</a>.</span>
    </template>

    <template #right>
      <UColorModeButton v-if="footer?.colorMode" />

      <template v-if="footer?.links">
        <UButton
          v-for="(link, index) of footer?.links"
          :key="index"
          v-bind="{ color: 'gray', variant: 'ghost', ...link }"
        />
      </template>
    </template>
  </UFooter>
</template>
