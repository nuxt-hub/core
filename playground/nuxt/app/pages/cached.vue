<script setup>
const { data } = await useFetch('/api/cached')
</script>

<template>
  <pre>{{ data }}</pre>
</template>
