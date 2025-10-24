<script lang="ts" setup>
defineProps<{
  quote: string
  author: any
}>()
</script>

<template>
  <UPageCTA
    :description="quote"
    variant="subtle"
    class="rounded-none"
    :ui="{ container: 'sm:py-12 lg:py-12 sm:gap-8', description: 'before:content-[open-quote] after:content-[close-quote] !text-base' }"
  >
    <UUser
      v-bind="author"
      size="xl"
      class="justify-center"
    />
  </UPageCTA>
</template>
