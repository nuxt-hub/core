<script setup lang="ts">
defineProps<{
  tabs?: string[]
}>()

const { data: table } = await useAsyncData('pricing-table', () => queryCollection('cloudflarePricing').first())
</script>

<template>
  <UTabs
    class="pt-8 sm:pt-0 pb-20 sm:pb-0 sm:w-full w-[calc(100vw-32px)]"
    color="neutral"
    variant="link"
    :items="table?.plans.filter(plan => !tabs || tabs.includes(plan.label))"
    :ui="{
      list: tabs?.length === 1 ? 'hidden' : ''
    }"
  >
    <template v-for="plan of table?.plans" :key="plan.label" #[plan.slot]="{ item }">
      <ProseTable class="rounded-sm">
        <ProseThead>
          <ProseTh v-for="(column, index) of item.columns" :key="index">
            {{ column.label }}
          </ProseTh>
        </ProseThead>
        <ProseTbody>
          <ProseTr v-for="(row, index) of item.rows" :key="index">
            <ProseTd>
              {{ row.title }}
            </ProseTd>
            <ProseTd>
              {{ row.free }}
            </ProseTd>
            <ProseTd>
              {{ row.paid }}
            </ProseTd>
          </ProseTr>
        </ProseTbody>
      </ProseTable>
      <!--      <UTable :data="item.rows" :columns="item.columns" /> -->
      <!--      <ProseTable
        v-bind="item"
        class="border dark:border-gray-800 border-gray-200 rounded-lg"
        :ui="{
          divide: 'dark:divide-gray-800 divide-gray-200'
        }"
      >
        <template #paid-data="{ row }">
          <span v-html="row.paid" />
        </template>
      </ProseTable>
      <div v-if="item.buttons?.length" class="mt-2 flex items-center gap-2 justify-center">
        <UButton v-for="button of item.buttons" :key="button.to" v-bind="button" color="gray" size="xs" variant="link" trailing-icon="i-lucide-arrow-up-right" target="_blank" />
      </div> -->
    </template>
  </UTabs>
</template>
