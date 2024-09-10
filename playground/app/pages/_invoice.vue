<script setup>
definePageMeta({
  layout: 'blank'
})

const currentDate = ref(new Date().toLocaleDateString())

const items = ref([
  { name: 'Item 1', quantity: 2, price: 10.00 },
  { name: 'Item 2', quantity: 1, price: 15.00 },
  { name: 'Item 3', quantity: 3, price: 7.50 }
])

const total = computed(() => {
  return items.value.reduce((sum, item) => sum + item.quantity * item.price, 0)
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
    <div class="bg-white rounded-lg overflow-hidden">
      <div class="p-4 sm:p-6 md:p-8">
        <div class="mb-6">
          <h1 class="text-3xl font-semibold text-gray-800">
            Invoice
          </h1>
        </div>
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row justify-between">
            <div class="mb-4 sm:mb-0">
              <p class="font-bold text-gray-700">
                Invoice To:
              </p>
              <p>John Doe</p>
              <p>123 Main St</p>
              <p>Anytown, USA 12345</p>
            </div>
            <div>
              <p><span class="font-bold text-gray-700">Invoice Number:</span> INV-001</p>
              <p><span class="font-bold text-gray-700">Date:</span> {{ currentDate }}</p>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th class="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th class="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th class="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th class="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(item, index) in items" :key="index">
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ item.name }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {{ item.quantity }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    ${{ item.price.toFixed(2) }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    ${{ (item.quantity * item.price).toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="flex justify-end">
            <div class="text-right">
              <p class="font-bold text-lg text-gray-700">
                Total: ${{ total.toFixed(2) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
