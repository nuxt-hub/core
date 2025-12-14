<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const route = useRoute()

const overviewMap: Record<string, string[]> = {
  '/docs/getting-started': [
    '/docs/getting-started',
    '/docs/getting-started/installation',
    '/docs/getting-started/deploy',
    '/docs/getting-started/migration'
  ],
  '/docs/guides': [
    '/docs/guides',
    '/docs/guides/pre-rendering',
    '/docs/guides/realtime'
  ]
}

const asideNavigation = computed(() => {
  const section = (navigation.value.find(l => l.path === '/docs')?.children ?? [])
    .find(l => route.path.startsWith(l.path))

  if (!section?.children) {
    return []
  }

  const links = section.children
  const overviewPaths = overviewMap[section.path]

  // Section has no overview grouping → return normal links
  if (!overviewPaths) {
    return links
  }

  const overviewChildren = links
    .filter(item => overviewPaths.includes(item.path))

  const otherLinks = links
    .filter(item => !overviewPaths.includes(item.path))

  return [
    {
      title: 'Overview',
      path: section.path,
      children: overviewChildren,
      defaultOpen: true
    },
    ...otherLinks
  ]
})
</script>

<template>
  <UMain>
    <UContainer>
      <UPage>
        <template #left>
          <UPageAside>
            <UContentNavigation :navigation="asideNavigation" highlight />
          </UPageAside>
        </template>
        <slot />
      </UPage>
    </UContainer>
  </UMain>
</template>
