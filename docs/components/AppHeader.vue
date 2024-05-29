<script setup lang="ts">
const { metaSymbol } = useShortcuts()
const links = [
  {
    label: 'Docs',
    to: '/docs/getting-started'
  }, {
    label: 'Templates',
    to: '/templates',
    color: 'cyan'
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
      <HubLogo class="h-6" />
      <UBadge variant="subtle" size="xs" class="-mb-[2px] rounded font-semibold">
        beta
      </UBadge>
    </template>

    <template #right>
      <UTooltip text="Search" :shortcuts="[metaSymbol, 'K']" :popper="{ strategy: 'absolute' }">
        <UContentSearchButton :label="null" />
      </UTooltip>
      <UButton variant="ghost" label="Log in" to="https://admin.hub.nuxt.com/" color="black" size="md" class="hidden sm:block" external />
      <UButton variant="solid" label="Sign up" to="https://admin.hub.nuxt.com/" size="md" class="hidden sm:block" external />
    </template>

    <template #panel>
      <UNavigationTree :links="links" />

      <div class="flex flex-col gap-y-2 mt-4">
        <UButton variant="solid" label="Log in" to="https://admin.hub.nuxt.com/" color="white" size="md" class="flex justify-center sm:hidden" external />
        <UButton variant="solid" label="Sign up" to="https://admin.hub.nuxt.com/" size="md" class="flex justify-center text-gray-900 bg-primary sm:hidden" external />
      </div>
    </template>
  </UHeader>
</template>
