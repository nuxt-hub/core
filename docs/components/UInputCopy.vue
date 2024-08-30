<script setup lang="ts">
defineProps({
  value: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'lg'
  }
})
const { copy, copied } = useClipboard()
</script>

<template>
  <label>
    <UInput :model-value="value" :size="size" disabled :ui="{ icon: { trailing: { pointer: '' } } }">
      <div class="absolute inset-0" :class="[copied ? 'cursor-default' : 'cursor-copy']" @click="copy(value)" />
      <template #trailing>
        <UButton
          :icon="copied ? 'i-ph-check' : 'i-ph-copy'"
          color="gray"
          variant="link"
          :padded="false"
          :class="{ 'text-green-500 hover:text-green-500 dark:text-green-400 hover:dark:text-green-400': copied }"
          aria-label="copy button"
          @click="copy(value)"
        />
      </template>
    </UInput>
  </label>
</template>
