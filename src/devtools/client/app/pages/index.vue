<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
// Redirect to first available storage page
// Order: kv -> blob -> cache (most commonly used first)
const pages = ['/kv-storage', '/blob-storage', '/cache-storage']
const router = useRouter()
const availablePages = router.getRoutes().map(r => r.path)
const target = pages.find(p => availablePages.includes(p)) || pages[0]
navigateTo(target, { replace: true })
</script>

<template>
  <div />
</template>
