<script setup>
const colorMode = useColorMode()

function toggleColorMode() {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
}

useHead({
  htmlAttrs: { lang: 'en' }
})

useSeoMeta({
  title: 'NuxtHub Demo',
  description:
    'A Nuxt demo hosted with Edge-side rendering, authentication and queyring a SQLite database'
})

const links = [
  { label: 'Home', to: '/' },
  { label: 'AI', to: '/ai' },
  { label: 'Database', to: '/database' },
  { label: 'KV', to: '/kv' },
  { label: 'Blob', to: '/blob' }
]
</script>

<template>
  <UContainer class="min-h-screen flex flex-col md:pt-12">
    <div class="flex justify-between">
      <UHorizontalNavigation :links="links" />
      <UButton
        square
        variant="ghost"
        color="black"
        :icon="$colorMode.preference === 'dark' ? 'i-heroicons-moon' : 'i-heroicons-sun'"
        @click="toggleColorMode"
      />
    </div>
    <NuxtPage />

    <footer class="text-center mt-2">
      <NuxtLink
        href="https://github.com/nuxt-hub/core"
        target="_blank"
        class="text-sm text-gray-500 hover:text-gray-700"
      >
        GitHub
      </NuxtLink>
      ·
      <NuxtLink
        href="https://twitter.com/nuxt_hub"
        target="_blank"
        class="text-sm text-gray-500 hover:text-gray-700"
      >
        Twitter
      </NuxtLink>
    </footer>
  </UContainer>
  <UNotifications />
</template>

<style lang="postcss">
body {
  @apply font-sans text-gray-950 bg-gray-50 dark:bg-gray-950 dark:text-gray-50;
}
</style>
