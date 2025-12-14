<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const route = useRoute()
const links = computed(() => [
  {
    label: 'Docs',
    to: '/docs/getting-started',
    active: route.path.startsWith('/docs'),
    icon: 'i-lucide-book'
  }, {
    label: 'Templates',
    to: '/templates',
    icon: 'i-lucide-panels-top-left'
  }, {
    label: 'Changelog',
    to: '/changelog',
    icon: 'i-lucide-megaphone'
  }
])

const navLinks = computed(() => links.value.map((link) => {
  if (link.label === 'Docs') {
    return {
      icon: link.icon,
      title: link.label,
      path: link.to,
      children: navigation.value.find(item => item.path === '/docs')?.children || []
    }
  }
  return {
    title: link.label,
    path: link.to,
    icon: link.icon
  }
}))

const { copy } = useClipboard()
const toast = useToast()
const logo = useTemplateRef('logo')
const logoContextMenuItems = [
  [{
    label: 'Copy logo as SVG',
    icon: 'i-simple-icons-nuxtdotjs',
    onSelect() {
      if (logo.value) {
        copy(logo.value.$el.outerHTML)
        toast.add({
          title: 'NuxtHub logo copied as SVG',
          description: 'You can now paste it into your project',
          icon: 'i-lucide-circle-check',
          color: 'success'
        })
      }
    }
  }]
]

const headerBottomLinks = computed(() => (navigation.value.find(link => link.path === '/docs')?.children ?? [])
  .map(link => ({ ...link, to: link.path, children: undefined, active: route.path.startsWith(link.path) })))
</script>

<template>
  <UHeader :ui="{ left: 'min-w-0' }" class="flex flex-col">
    <template #left>
      <UContextMenu :items="logoContextMenuItems" size="xs">
        <NuxtLink to="/" class="inline-flex items-end gap-2" aria-label="Back to home">
          <HubLogo ref="logo" class="h-6" />
          <VersionMenu />
        </NuxtLink>
      </UContextMenu>
    </template>

    <UNavigationMenu :items="links.map(({ icon, ...link }) => link)" variant="link" :ui="{ link: 'text-highlighted hover:text-primary data-active:text-primary' }" />

    <template #right>
      <div class="flex items-center gap-2">
        <UTooltip text="Search" :kbds="['meta', 'K']" :popper="{ strategy: 'absolute' }">
          <UContentSearchButton :label="null" />
        </UTooltip>
        <UColorModeButton />
        <UButton to="https://github.com/nuxt-hub/core" target="_blank" icon="i-simple-icons-github" variant="ghost" color="neutral" />
      </div>
    </template>

    <template #body>
      <UContentNavigation :navigation="navLinks" highlight type="single" :default-open="$route.path.startsWith('/docs')" />

      <div class="flex flex-col gap-y-2 mt-4">
        <USeparator class="mb-4" />
        <UButton label="Get started" color="neutral" to="/docs/getting-started/installation" class="flex justify-center text-gray-900 bg-primary sm:hidden" external />
      </div>
    </template>
    <template v-if="route.path.startsWith('/docs/')" #bottom>
      <USeparator class="hidden lg:flex" />
      <UContainer class="hidden lg:flex items-center justify-between">
        <UNavigationMenu
          :items="headerBottomLinks"
          label-key="title"
          variant="pill"
          highlight
          class="-mx-2.5 -mb-px"
        />
      </UContainer>
    </template>
  </UHeader>
</template>
