<script setup lang="ts">
defineProps({
  value: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: 'lg'
  }
})
const { copy, copied } = useClipboard()
</script>

<template>
  <UInput
    :model-value="value"
    :size="size"
    disabled
    :ui="{ icon: { trailing: { pointer: '' } } }"
  >
    <div class="absolute inset-0" :class="[copied ? 'cursor-default' : 'cursor-copy']" @click="copy(value)" />
    <template #trailing>
      <UButton
        color="gray"
        variant="link"
        :icon="copied ? 'i-ph-check' : 'i-ph-copy'"
        :class="{ 'text-green-500 hover:text-green-500 dark:text-green-400 hover:dark:text-green-400': copied }"
        :padded="false"
        @click="copy(value)"
      />
    </template>
  </UInput>
</template>
