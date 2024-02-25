<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'

const navigation = inject<NavItem[]>('navigation', [])

const { header } = useAppConfig()
</script>

<template>
  <UHeader :ui="{}">
    <template #logo>
      <template v-if="header?.logo?.dark || header?.logo?.light">
        <UColorModeImage v-bind="{ class: 'h-6 w-auto', ...header?.logo }" />
      </template>
      <template v-else>
        <Logo />
      </template>
    </template>

    <template v-if="header?.search" #center>
      <UContentSearchButton class="hidden lg:flex" />
    </template>

    <template #right>
      <UContentSearchButton v-if="header?.search" :label="null" class="lg:hidden" />

      <UColorModeButton v-if="header?.colorMode" />

      <template v-if="header?.links">
        <UButton
          v-for="(link, index) of header.links"
          :key="index"
          v-bind="{ color: 'gray', variant: 'ghost', ...link }"
        />
      </template>
      <UButton to="https://console.hub.nuxt.com/?utm_source=nuxthub-docs&utm_medium=header" external icon="i-simple-icons-nuxtdotjs" color="black" class="hidden sm:inline-flex">
        NuxtHub Console
      </UButton>
    </template>

    <template #panel>
      <UNavigationTree :links="mapContentNavigation(navigation)" />

      <div class="flex py-2">
        <UButton to="https://console.hub.nuxt.com/?utm_source=nuxthub-docs&utm_medium=header" external icon="i-simple-icons-nuxtdotjs" color="black" block class="sm:hidden">
          NuxtHub Console
        </UButton>
      </div>
    </template>
  </UHeader>
</template>
