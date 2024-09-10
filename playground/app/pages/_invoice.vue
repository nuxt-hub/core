<script setup>
definePageMeta({
  layout: 'blank'
})

// TODO: Fetch data from API instead of hardcoding
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
  <div style="font-family: Arial, sans-serif; padding: 20px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
      <div>
        <p><strong>Invoice To:</strong></p>
        <p>John Doe</p>
        <p>123 Main St</p>
        <p>Anytown, USA 12345</p>
      </div>
      <div>
        <p><strong>Invoice Number:</strong> INV-001</p>
        <p><strong>Date:</strong> {{ currentDate }}</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in items" :key="index">
          <td>{{ item.name }}</td>
          <td>{{ item.quantity }}</td>
          <td>${{ item.price.toFixed(2) }}</td>
          <td>${{ (item.quantity * item.price).toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>
    <div style="text-align: right; margin-top: 20px;">
      <p><strong>Total: ${{ total.toFixed(2) }}</strong></p>
    </div>
  </div>
</template>

<style scoped>
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
th { background-color: #f2f2f2; }
</style>
