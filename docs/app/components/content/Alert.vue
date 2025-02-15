<script setup lang="ts">
import type uiColors from '#ui-colors'

const props = defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: '' },
  color: { type: String as PropType<(typeof uiColors)[number]>, required: true },
  to: { type: String, default: '' }
})

const target = computed(() => (props.to?.startsWith('https://') ? '_blank' : ''))
</script>

<template>
  <ProseCallout :icon="icon" :color="color" :to="to" :target="target">
    <slot mdc-unwrap="p" />
  </ProseCallout>
</template>
