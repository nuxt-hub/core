<script setup lang="ts">
import { useFetch } from '#app'

const { data: manifest } = useFetch('/api/manifest')
</script>

<template>
  <pre>{{ manifest }}</pre>
</template>
