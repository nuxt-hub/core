<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'

const navigation = inject<Ref<NavItem[]>>('navigation')

const links = mapContentNavigation(navigation.value).find(link => link.label === 'Docs').children
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UAside>
          <UNavigationTree :links="links" />
        </UAside>
      </template>
      <slot />
    </UPage>
  </UContainer>
</template>
