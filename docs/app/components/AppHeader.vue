<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const route = useRoute()
const links = computed(() => [
  {
    label: 'Docs',
    to: '/docs/getting-started',
    active: route.path.startsWith('/docs'),
    icon: 'i-lucide-book-open'
  }, {
    label: 'Templates',
    to: '/templates',
    icon: 'i-lucide-panels-top-left'
  }, {
    label: 'Pricing',
    to: '/pricing',
    icon: 'i-lucide-credit-card'
  }, {
    label: 'Changelog',
    to: '/changelog',
    icon: 'i-lucide-megaphone'
  }, {
    label: 'Blog',
    to: '/blog',
    icon: 'i-lucide-newspaper'
  }
])

const navLinks = computed(() => links.value.map((link) => {
  if (link.label === 'Docs') {
    return {
      icon: link.icon,
      title: link.label,
      path: link.to,
      children: navigation.value
    }
  }
  return {
    title: link.label,
    path: link.to,
    icon: link.icon
  }
}))
const ready = ref(false)
const authenticated = ref(false)
onMounted(async () => {
  const endpoint = import.meta.dev ? 'http://localhost:3000/api/authenticated' : 'https://admin.hub.nuxt.com/api/authenticated'
  await $fetch(endpoint, {
    credentials: 'include'
  }).then((state: { authenticated: boolean }) => {
    authenticated.value = state.authenticated
  }).catch(() => {
    authenticated.value = false
  })
  nextTick(() => {
    ready.value = true
  })
})
</script>

<template>
  <UHeader>
    <template #left>
      <div class="inline-flex items-end gap-2">
        <NuxtLink to="/" aria-label="NuxtHub"><HubLogo class="h-6" /></NuxtLink>
        <UBadge variant="subtle" size="sm" class="relative top-[2px]">
          beta
        </UBadge>
      </div>
    </template>

    <UNavigationMenu :items="links.map(({ icon, ...link }) => link)" variant="link" :ui="{ link: 'text-(--ui-text-highlighted) hover:text-(--ui-primary) data-active:text-(--ui-primary)' }" />

    <template #right>
      <div class="flex items-center gap-2 transition-opacity duration-300" :class="[ready ? 'opacity-100' : 'opacity-0']">
        <UTooltip text="Search" :kbds="['meta', 'K']" :popper="{ strategy: 'absolute' }">
          <UContentSearchButton :label="null" size="sm" />
        </UTooltip>
        <UButton v-if="ready && !authenticated" size="sm" label="Log in" color="neutral" variant="subtle" to="https://admin.hub.nuxt.com/?utm_source=hub-docs&utm_medium=header&utm_campaign=login" class="hidden sm:inline-flex" external />
        <UButton v-if="ready && !authenticated" size="sm" label="Sign up" color="neutral" to="https://admin.hub.nuxt.com/?utm_source=hub-docs&utm_medium=header&utm_campaign=signup" class="hidden sm:inline-flex" external />
        <UButton v-if="ready && authenticated" size="sm" label="Dashboard" to="https://admin.hub.nuxt.com/?utm_source=hub-docs&utm_medium=header&utm_campaign=dashboard" class="hidden sm:inline-flex" external />
      </div>
    </template>

    <template #body>
      <UContentNavigation :navigation="navLinks" highlight type="single" :default-open="$route.path.startsWith('/docs')" :ui="{ itemWithChildren: 'ps-1.5' }" />

      <div class="flex flex-col gap-y-2 mt-4">
        <USeparator class="mb-4" />
        <UButton v-if="ready && !authenticated" label="Log in" color="neutral" variant="subtle" to="https://admin.hub.nuxt.com/?utm_source=hub-docs&utm_medium=header&utm_campaign=login" class="flex justify-center sm:hidden" external />
        <UButton v-if="ready && !authenticated" label="Sign up" color="neutral" to="https://admin.hub.nuxt.com/?utm_source=hub-docs&utm_medium=header&utm_campaign=signup" class="flex justify-center text-gray-900 bg-(--ui-primary) sm:hidden" external />
        <UButton v-if="ready && authenticated" label="Dashboard" to="https://admin.hub.nuxt.com/?utm_source=hub-docs&utm_medium=header&utm_campaign=dashboard" class="flex justify-center text-gray-900 bg-(--ui-primary) sm:hidden" external />
      </div>
    </template>
  </UHeader>
</template>
