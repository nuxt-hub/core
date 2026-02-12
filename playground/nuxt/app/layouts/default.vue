<script setup>
const colorMode = useColorMode()

function toggleColorMode() {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
}

useHead({
  htmlAttrs: { lang: 'en' }
})

useSeoMeta({
  title: 'NuxtHub Demo (Nuxt)',
  description:
    'A Nuxt demo hosted with Edge-side rendering, authentication and queyring a SQLite database'
})

const links = [
  { label: 'Home', to: '/' },
  { label: 'Blob', to: '/blob' },
  { label: 'Database', to: '/database' },
  { label: 'KV', to: '/kv' }
]
</script>

<template>
  <UContainer class="min-h-screen md:pt-12 max-w-screen-md">
    <div class="flex justify-between">
      <UNavigationMenu :items="links" />
      <div class="flex items-center gap-2">
        <UBadge label="Nuxt Module" color="emerald" variant="subtle" size="sm" />
        <ColorScheme>
        <UButton
          square
          variant="ghost"
          color="neutral"
          :icon="$colorMode.preference === 'dark' ? 'i-heroicons-moon' : 'i-heroicons-sun'"
          @click="toggleColorMode"
        />
      </ColorScheme>
      </div>
    </div>
    <slot />

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
</template>
