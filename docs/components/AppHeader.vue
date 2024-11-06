<script setup lang="ts">
const { metaSymbol } = useShortcuts()
const navigation = inject('navigation')

const links = [
  {
    label: 'Docs',
    to: '/docs/getting-started',
    icon: 'i-lucide-book'
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
]
const navLinks = links.map((link) => {
  if (link.label === 'Docs') {
    return {
      ...link,
      children: mapContentNavigation(navigation.value)
        .find(link => link.label === 'Docs')
        .children
        .map(({ icon, ...link }) => link) // eslint-disable-line @typescript-eslint/no-unused-vars
    }
  }
  return {
    ...link
  }
})
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
  <UHeader :ui="{}" :links="links">
    <template #logo>
      <HubLogo class="h-6" />
      <UBadge variant="subtle" size="xs" class="-mb-[2px] rounded font-semibold">
        beta
      </UBadge>
    </template>

    <template #right>
      <div class="flex items-center gap-1.5 transition-opacity duration-300" :class="[ready ? 'opacity-100' : 'opacity-0']">
        <UButton color="gray" variant="ghost" icon="i-simple-icons-github" to="https://github.com/nuxt-hub/core" target="_blank" />
        <UTooltip text="Search" :shortcuts="[metaSymbol, 'K']" :popper="{ strategy: 'absolute' }">
          <UContentSearchButton :label="null" />
        </UTooltip>
        <UColorModeButton />
        <UButton v-if="ready && !authenticated" size="sm" variant="ghost" label="Log in" to="https://admin.hub.nuxt.com/?utm_source=hub-docs&utm_medium=header&utm_campaign=login" color="gray" class="hidden sm:inline-flex" external />
        <UButton v-if="ready && !authenticated" size="sm" variant="solid" label="Get started" to="https://admin.hub.nuxt.com/?utm_source=hub-docs&utm_medium=header&utm_campaign=signup" class="hidden sm:inline-flex" external />
        <UButton v-if="ready && authenticated" size="sm" label="Dashboard" to="https://admin.hub.nuxt.com/?utm_source=hub-docs&utm_medium=header&utm_campaign=dashboard" color="green" class="hidden sm:inline-flex" external />
      </div>
    </template>

    <template #panel>
      <UNavigationTree :links="navLinks" default-open :multiple="false" :ui="{ accordion: { button: { label: 'font-normal' } } }" />

      <div class="flex flex-col gap-y-2 mt-4">
        <UDivider class="mb-4" />
        <UButton v-if="ready && !authenticated" variant="solid" label="Log in" to="https://admin.hub.nuxt.com/?utm_source=hub-docs&utm_medium=header&utm_campaign=login" color="white" class="flex justify-center sm:hidden" external />
        <UButton v-if="ready && !authenticated" variant="solid" label="Sign up" to="https://admin.hub.nuxt.com/?utm_source=hub-docs&utm_medium=header&utm_campaign=signup" class="flex justify-center text-gray-900 bg-primary sm:hidden" external />
        <UButton v-if="ready && authenticated" variant="solid" color="green" label="Dashboard" to="https://admin.hub.nuxt.com/?utm_source=hub-docs&utm_medium=header&utm_campaign=dashboard" class="flex justify-center text-gray-900 bg-primary sm:hidden" external />
      </div>
    </template>
  </UHeader>
</template>
