<script setup lang="ts">
defineProps<{
  name: string
  description?: string
  type?: string
  required?: boolean
  default?: string
  class?: any
}>()
</script>

<template>
  <div v-bind="$attrs">
    <div class="flex items-start gap-x-2.5 font-mono text-sm">
      <div class="flex flex-1 gap-x-2.5">
        <span class="rounded-md font-semibold text-(--ui-primary)">{{ name }}</span>
        <span v-if="required" class="text-(--ui-text-muted)">required</span>
      </div>

      <div v-if="type" class="text-right">
        {{ type }}
      </div>
    </div>

    <div v-if="$slots.default || description" class="mt-3 mb-0 text-(--ui-text-accented) text-sm space-y-3">
      <slot>
        {{ description }}
      </slot>
    </div>
  </div>
</template>
