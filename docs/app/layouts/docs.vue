<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'
import { mapContentNavigation } from '#ui-pro/utils'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const links = mapContentNavigation(navigation.value).find(link => link.label === 'Docs').children
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UPageAside>
          <UContentNavigation :links="links" />
        </UPageAside>
      </template>
      <slot />
    </UPage>
  </UContainer>
</template>
