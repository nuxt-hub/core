<template>
  <Alert
    title="Note"
    icon="i-ph-info-duotone"
    color="blue"
    class="prose-a:text-blue-500 hover:prose-a:border-blue-500 dark:prose-a:text-blue-400 dark:hover:prose-a:border-blue-400 dark:!bg-blue-800/40 !bg-blue-200/40 dark:!border-blue-600/30 !border-blue-400/30"
    :class="$attrs.to ? 'dark:hover:!border-blue-600/50 hover:!border-blue-400/50' : ''"
  >
    <ContentSlot :use="$slots.default" unwrap="p" />
  </Alert>
</template>
