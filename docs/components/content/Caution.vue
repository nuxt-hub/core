<template>
  <Alert
    title="Caution"
    icon="i-ph-warning-octagon-duotone"
    color="red"
    class="prose-a:text-red-500 hover:prose-a:border-red-500 dark:prose-a:text-red-400 dark:hover:prose-a:border-red-400 dark:!bg-red-800/40 !bg-red-200/40 dark:!border-red-600/30 !border-red-400/30"
    :class="$attrs.to ? 'dark:hover:!border-red-600/50 hover:!border-red-400/50' : ''"
  >
    <ContentSlot :use="$slots.default" unwrap="p" />
  </Alert>
</template>
