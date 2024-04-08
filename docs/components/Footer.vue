<script setup lang="ts">
const links = [
  {
    label: 'Nuxt UI',
    to: 'https://ui.nuxt.com/'
  }, {
    label: 'Nuxt Docs',
    to: 'https://nuxt.com'
  }, {
    label: 'Nuxt Studio',
    to: 'https://nuxt.studio'
  }
]
</script>

<template>
  <UFooter :links="links">
    <template #left>
      Copyright © {{ new Date().getFullYear() }}
    </template>

    <template #right>
      <UColorModeButton />
      <UButton icon="i-simple-icons-x" color="gray" variant="ghost" to="https://x.com/nuxt_js" target="_blank" />
      <UButton
        icon="i-simple-icons-github" color="gray" variant="ghost" to="https://github.com/nuxt/nuxt"
        target="_blank"
      />
    </template>
  </UFooter>
</template>
