<script setup lang="ts">
const { metaSymbol } = useShortcuts()
const navigation = inject('navigation')

const links = [
  {
    label: 'Docs',
    to: '/docs/getting-started',
    icon: 'i-ph-books'
  }, {
    label: 'Templates',
    to: '/templates',
    icon: 'i-ph-layout'
  }, {
    label: 'Pricing',
    to: '/pricing',
    icon: 'i-ph-credit-card'
  }, {
    label: 'Changelog',
    to: '/changelog',
    icon: 'i-ph-pulse'
  }, {
    label: 'Blog',
    to: '/blog',
    icon: 'i-ph-newspaper'
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
      <UTooltip text="Search" :shortcuts="[metaSymbol, 'K']" :popper="{ strategy: 'absolute' }">
        <UContentSearchButton :label="null" />
      </UTooltip>
      <UButton variant="ghost" label="Log in" to="https://admin.hub.nuxt.com/" color="black" class="hidden sm:block" external />
      <UButton variant="solid" label="Sign up" to="https://admin.hub.nuxt.com/" class="hidden sm:block" external />
    </template>

    <template #panel>
      <UNavigationTree :links="navLinks" :default-open="1" :multiple="false" :ui="{ accordion: { button: { label: 'font-normal' } } }" />

      <div class="flex flex-col gap-y-2 mt-4">
        <UButton variant="solid" label="Log in" to="https://admin.hub.nuxt.com/" color="white" class="flex justify-center sm:hidden" external />
        <UButton variant="solid" label="Sign up" to="https://admin.hub.nuxt.com/" class="flex justify-center text-gray-900 bg-primary sm:hidden" external />
      </div>
    </template>
  </UHeader>
</template>
