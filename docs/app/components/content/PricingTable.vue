<script setup lang="ts">
const props = defineProps<{
  tabs?: string[]
}>()

const { data: table } = await useAsyncData('pricing-table', () => {
  return queryCollection('cloudflarePricing').first()
})

const filteredPlans = computed(() => {
  if (!table.value?.plans) return []

  if (!props.tabs || !props.tabs.length) {
    return table.value.plans
  }

  return table.value.plans.filter(plan => props.tabs!.includes(plan.label))
})
</script>

<template>
  <UTabs
    class="pt-8 sm:pt-0 pb-20 sm:pb-0 sm:w-full w-[calc(100vw-32px)]"
    color="neutral"
    :items="filteredPlans"
    :ui="{
      list: tabs?.length === 1 ? 'hidden' : 'bg-transparent border border-default',
      indicator: 'bg-muted',
      trigger: 'data-[state=active]:text-highlighted)',
      leadingIcon: 'size-4 sm:inline-flex hidden'
    }"
  >
    <template v-for="(plan, index) of table?.plans" :key="index" #[plan.slot]="{ item }">
      <ProseTable>
        <ProseThead class="bg-transparent">
          <ProseTr>
            <ProseTh v-for="(column, colIndex) of item.columns" :key="colIndex" class="border-default first:rounded-tl-(--ui-radius) last:rounded-tr-(--ui-radius)">
              {{ column.label }}
            </ProseTh>
          </ProseTr>
        </ProseThead>
        <ProseTbody>
          <ProseTr v-for="(row, rowIndex) of item.rows" :key="rowIndex">
            <ProseTd class="border-default">
              <MDC :value="row.title" unwrap="p" />
            </ProseTd>
            <ProseTd class="border-default">
              <MDC :value="row.free" unwrap="p" />
            </ProseTd>
            <ProseTd class="border-default">
              <MDC :value="row.paid" unwrap="p" />
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
