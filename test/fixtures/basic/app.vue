<script setup lang="ts">
import { useFetch } from '#app'

const { data: manifest } = useFetch('/api/_hub/manifest')
</script>

<template>
  <h3>Data storage enabled:</h3>
  <ul>
    <li
      v-for="primitive in Object.keys(manifest?.storage || {})"
      :key="primitive"
    >
      {{ primitive }}
    </li>
  </ul>
</template>
