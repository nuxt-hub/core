<script setup lang="ts">
import { useFetch } from '#app'

const { data: manifest } = useFetch<Record<string, any>>('/api/manifest')
</script>

<template>
  <h3>Data storage enabled:</h3>
  <ul>
    <li
      v-for="primitive in Object.keys(manifest?.storage || {}).filter(key => manifest?.storage[key])"
      :key="primitive"
    >
      {{ primitive }}
    </li>
  </ul>
</template>
