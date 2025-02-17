<script setup lang="ts">
defineProps<{
  tabs?: string[]
}>()

const { data: table } = await useAsyncData('pricing-table', () => queryCollection('cloudflarePricing').first())
// TODO: Fix hydration issue
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
      <ProseTable>
        <ProseThead class="bg-transparent">
          <ProseTh v-for="(column, index) of item.columns" :key="index">
            {{ column.label }}
          </ProseTh>
        </ProseThead>
        <ProseTbody>
          <ProseTr v-for="(row, index) of item.rows" :key="index">
            <ProseTd>
              <MDC :value="row.title" />
            </ProseTd>
            <ProseTd>
              <MDC :value="row.free" />
            </ProseTd>
            <ProseTd>
              <MDC :value="row.paid" />
            </ProseTd>
          </ProseTr>
        </ProseTbody>
      </ProseTable>
      <div v-if="item.buttons?.length" class="mt-2 flex items-center gap-2 justify-center">
        <UButton v-for="button of item.buttons" :key="button.to" v-bind="button" color="neutral" size="xs" variant="link" trailing-icon="i-lucide-arrow-up-right" target="_blank" />
      </div>
    </template>
  </UTabs>
</template>
