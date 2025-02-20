<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const asideNavigation = computed(() => navigation.value.find(item => item.path === '/docs')?.children || [])
</script>

<template>
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
</template>
