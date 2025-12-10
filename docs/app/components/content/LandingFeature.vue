<script lang="ts" setup>
defineProps<{
  icon: string
  title: string
  description: string
  soon?: boolean
  to?: string
}>()
</script>

<template>
  <div
    class="flex items-start gap-x-3 relative group"
    :class="{ 'opacity-75': soon }"
  >
    <NuxtLink v-if="to" :to="to" class="absolute inset-0 z-10" />
    <div class="p-[3px] border border-dashed rounded-md border-accented">
      <div class="bg-muted p-1.5 rounded-md flex items-center justify-center border border-default">
        <UIcon :name="icon" class="size-6 shrink-0" />
      </div>
    </div>
    <div class="flex flex-col">
      <h2 class="font-medium text-highlighted inline-flex items-center gap-x-1">
        {{ title }} <UBadge v-if="soon" color="neutral" variant="subtle" size="sm" class="rounded-full">
          Soon
        </UBadge>
        <UIcon v-if="to" name="i-lucide-arrow-right" class="size-4 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-1 group-hover:translate-x-0" />
      </h2>
      <p class="text-sm text-muted">
        {{ description }}
      </p>
    </div>
  </div>
</template>
