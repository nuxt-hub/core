<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'

const navigation = inject<NavItem[]>('navigation', [])
const { metaSymbol } = useShortcuts()
const links = [
  {
    label: 'Docs',
    to: '/docs/getting-started',
    children: mapContentNavigation(navigation)
  }, {
    label: 'Templates',
    to: '/templates'
  }, {
    label: 'Pricing',
    to: '/pricing'
  }, {
    label: 'Changelog',
    to: '/changelog'
  }, {
    label: 'Blog',
    to: '/blog'
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
      <UButton variant="ghost" label="Log in" to="/login" color="black" size="md" class="hidden sm:block" external />
      <UButton variant="solid" label="Sign up" to="/signup" size="md" class="text-gray-900 bg-green-400 hidden sm:block" external />
    </template>

    <template #panel>
      <UNavigationTree :links="links" />

      <div class="flex flex-col gap-y-2 mt-4">
        <UButton variant="solid" label="Log in" to="/login" color="white" size="md" class="flex justify-center" external />
        <UButton variant="solid" label="Sign up" to="/signup" size="md" class="flex justify-center text-gray-900 bg-primary" external />
      </div>
    </template>
  </UHeader>
</template>
