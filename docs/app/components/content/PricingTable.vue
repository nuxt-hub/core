<script setup lang="ts">
defineProps<{
  tabs?: string[]
}>()

const { data: table } = await useAsyncData('pricing-table', () => queryCollection('cloudflarePricing').first())
</script>

<template>
  <UTabs
    class="pt-8 sm:pt-0 pb-20 sm:pb-0 sm:w-full w-[calc(100vw-32px)] not-prose"
    color="neutral"
    variant="link"
    :items="table?.plans.filter(plan => !tabs || tabs.includes(plan.label))"
    :ui="{
      list: {
        base: tabs?.length === 1 ? 'hidden' : '',
        background: 'dark:bg-gray-950 border dark:border-gray-800 bg-white',
        height: 'h-[42px]',
        marker: {
          background: 'bg-gray-100 dark:bg-gray-800'
        },
        tab: {
          icon: 'hidden sm:inline-flex'
        }
      }
    }"
  >
    <template #item="{ item }">
      <UTable
        v-bind="item"
        class="border dark:border-gray-800 border-gray-200 rounded-lg"
        :ui="{
          divide: 'dark:divide-gray-800 divide-gray-200'
        }"
      >
        <template #paid-data="{ row }">
          <span v-html="row.paid" />
        </template>
      </UTable>
      <div v-if="item.buttons?.length" class="mt-2 flex items-center gap-2 justify-center">
        <UButton v-for="button of item.buttons" :key="button.to" v-bind="button" color="gray" size="xs" variant="link" trailing-icon="i-lucide-arrow-up-right" target="_blank" />
      </div>
    </template>
  </UTabs>
</template>
