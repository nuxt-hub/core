<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'

const navigation = inject<NavItem[]>('navigation', [])
const { metaSymbol } = useShortcuts()
const { header } = useAppConfig()
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
    to: 'https://admin.hub.nuxt.com/?utm_source=nuxthub-docs&utm_medium=header',
    target: '_blank'
  }
]
</script>

<template>
  <UHeader :ui="{}" :links="links">
    <template #logo>
      <Logo />
    </template>

    <template #right>
      <UTooltip text="Search" :shortcuts="[metaSymbol, 'K']" :popper="{ strategy: 'absolute' }">
        <UContentSearchButton :label="null" />
      </UTooltip>
      <UColorModeButton />
      <template v-if="header?.links">
        <UButton
          v-for="(link, index) of header.links"
          :key="index"
          v-bind="{ color: 'gray', variant: 'ghost', ...link }"
        />
      </template>
      <UButton to="https://admin.hub.nuxt.com/?utm_source=nuxthub-docs&utm_medium=header" external icon="i-simple-icons-nuxtdotjs" color="black" class="hidden sm:inline-flex">
        NuxtHub Admin
      </UButton>
    </template>

    <template #panel>
      <UNavigationTree :links="mapContentNavigation(navigation)" />

      <div class="flex py-2 mt-2">
        <UButton to="https://admin.hub.nuxt.com/?utm_source=nuxthub-docs&utm_medium=header" external icon="i-simple-icons-nuxtdotjs" color="black" block class="sm:hidden">
          NuxtHub Admin
        </UButton>
      </div>
    </template>
  </UHeader>
</template>
