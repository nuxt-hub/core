<template>
  <Alert
    title="Warning"
    icon="i-ph-warning-duotone"
    color="amber"
    class="prose-a:text-amber-500 hover:prose-a:border-amber-500 dark:prose-a:text-amber-400 dark:hover:prose-a:border-amber-400 dark:!bg-amber-800/40 dark:!border-amber-800/40 !bg-amber-200/30 !border-amber-400/30"
    :class="$attrs.to ? 'dark:hover:!border-amber-600/50 hover:!border-amber-400/50' : ''"
  >
    <ContentSlot :use="$slots.default" unwrap="p" />
  </Alert>
</template>
